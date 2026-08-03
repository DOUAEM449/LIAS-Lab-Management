import { useCallback, useEffect, useState } from 'react';
import { Package, Plus, AlertCircle, Pencil, Trash2, Loader2, ClipboardList } from 'lucide-react';
import StatCard from '../components/StatCard';
import EquipmentFormModal from '../components/EquipmentFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TextField, TextAreaField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import {
  searchEquipment,
  deleteEquipment,
  listEquipmentRequestsByStatus,
  listMyEquipmentRequests,
  submitEquipmentRequest,
  approveEquipmentRequest,
  rejectEquipmentRequest,
} from '../services/equipmentService';
import { EQUIPMENT_ADMIN_ROLES, EQUIPMENT_DECISION_ROLES, hasRole } from '../utils/roles';

const STATUS_BADGE = {
  PENDING: 'bg-lias-warning-bg text-lias-warning-text',
  APPROVED: 'bg-lias-success-bg text-lias-success-text',
  REJECTED: 'bg-lias-danger-bg text-lias-danger-text',
  FULFILLED: 'bg-blue-100 text-blue-700',
};
const STATUS_LABEL_FR = { PENDING: 'En attente', APPROVED: 'Approuvée', REJECTED: 'Refusée', FULFILLED: 'Fournie' };

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function EquipmentPage({ user }) {
  const canManageInventory = hasRole(user, EQUIPMENT_ADMIN_ROLES);
  const canDecideRequests = hasRole(user, EQUIPMENT_DECISION_ROLES);

  const [tab, setTab] = useState(canManageInventory ? 'inventory' : 'requests');
  const toast = useToasts();

  const [equipment, setEquipment] = useState([]);
  const [equipLoading, setEquipLoading] = useState(true);
  const [equipError, setEquipError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [myRequests, setMyRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);
  const [reqForm, setReqForm] = useState({ itemName: '', description: '', quantity: 1 });
  const [submittingReq, setSubmittingReq] = useState(false);
  const [decidingId, setDecidingId] = useState(null);

  const loadEquipment = useCallback(() => {
    setEquipLoading(true);
    setEquipError(null);
    searchEquipment()
      .then((res) => setEquipment(res.content))
      .catch((err) => setEquipError(friendlyError(err, 'Échec du chargement du matériel')))
      .finally(() => setEquipLoading(false));
  }, []);

  const loadRequests = useCallback(() => {
    setRequestsLoading(true);
    setRequestsError(null);
    // Technical accounts (SYSTEM_ADMIN, or a DIRECTOR/VICE_DIRECTOR created
    // directly via user administration rather than an approved membership
    // request) have no linked Member profile, so "mine" 404s for them. Load
    // "mine" and "pending" independently so one failing doesn't blank out
    // the other — a management user with no member profile should still see
    // the pending-requests panel.
    const tasks = [
      listMyEquipmentRequests()
        .then((res) => setMyRequests(res.content))
        .catch(() => setMyRequests([])),
    ];
    if (canDecideRequests) {
      tasks.push(
        listEquipmentRequestsByStatus('PENDING')
          .then((res) => setPendingRequests(res.content))
          .catch((err) => setRequestsError(friendlyError(err, 'Échec du chargement des demandes en attente')))
      );
    }
    Promise.all(tasks).finally(() => setRequestsLoading(false));
  }, [canDecideRequests]);

  useEffect(() => {
    if (canManageInventory) loadEquipment();
  }, [canManageInventory, loadEquipment]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setFormOpen(true);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEquipment(deleteTarget.id);
      toast.success('Matériel supprimé.');
      setDeleteTarget(null);
      loadEquipment();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la suppression'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    if (!reqForm.itemName) return;
    setSubmittingReq(true);
    try {
      await submitEquipmentRequest({
        itemName: reqForm.itemName,
        description: reqForm.description || undefined,
        quantity: Number(reqForm.quantity),
      });
      setReqForm({ itemName: '', description: '', quantity: 1 });
      toast.success('Demande soumise.');
      loadRequests();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la soumission de la demande'));
    } finally {
      setSubmittingReq(false);
    }
  }

  async function handleDecide(id, action) {
    setDecidingId(id);
    try {
      if (action === 'approve') await approveEquipmentRequest(id);
      else await rejectEquipmentRequest(id);
      toast.success(action === 'approve' ? 'Demande approuvée.' : 'Demande refusée.');
      loadRequests();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la décision'));
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <div className="mb-6">
        <h1 className="m-0 text-[22px] font-bold text-lias-navy">Gestion du Matériel</h1>
        <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
          Inventaire du laboratoire et demandes de matériel des membres.
        </p>
      </div>

      <div className="flex items-center gap-1.5 bg-lias-bg rounded-lg p-1 w-fit mb-5">
        {canManageInventory && (
          <button
            onClick={() => setTab('inventory')}
            className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium cursor-pointer border-none transition-colors ${
              tab === 'inventory' ? 'bg-white text-lias-navy shadow-sm' : 'bg-transparent text-lias-muted'
            }`}
          >
            Inventaire
          </button>
        )}
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium cursor-pointer border-none transition-colors ${
            tab === 'requests' ? 'bg-white text-lias-navy shadow-sm' : 'bg-transparent text-lias-muted'
          }`}
        >
          Demandes de matériel
        </button>
      </div>

      {tab === 'inventory' && canManageInventory && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={openCreate}
              className="bg-lias-blue text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2"
            >
              <Plus size={16} />
              Ajouter du matériel
            </button>
          </div>

          {equipError && (
            <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
              <AlertCircle size={16} />
              {equipError}
            </div>
          )}

          <div className="mb-7 max-w-xs">
            <StatCard label="Références en stock" value={equipment.length} icon={Package} loading={equipLoading} />
          </div>

          <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
            {equipLoading ? (
              <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Chargement...</div>
            ) : equipment.length === 0 ? (
              <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Aucun matériel enregistré.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-lias-bg">
                      {['Nom', 'Catégorie', 'Disponible / Total', ''].map((h, i) => (
                        <th
                          key={h + i}
                          className={`text-[11.5px] font-semibold text-lias-muted uppercase tracking-wider py-3 ${
                            i === 3 ? 'px-5.5 text-right' : 'px-5.5 text-left'
                          }`}
                        >
                          {i === 3 ? 'Actions' : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => openEdit(item)}
                        className="border-t border-lias-border-light cursor-pointer hover:bg-lias-bg/60"
                      >
                        <td className="px-5.5 py-3.5 text-[13px] font-medium text-lias-ink">{item.name}</td>
                        <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{item.category || '—'}</td>
                        <td className="px-5.5 py-3.5 text-[13px] text-lias-muted font-mono">
                          {item.availableQuantity} / {item.quantity}
                        </td>
                        <td className="px-5.5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEdit(item)}
                              className="w-8 h-8 rounded-lg border border-lias-border bg-white cursor-pointer flex items-center justify-center text-lias-muted hover:text-lias-blue-dark"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="w-8 h-8 rounded-lg border border-rose-200 bg-white cursor-pointer flex items-center justify-center text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'requests' && (
        <>
          <div className="bg-white border border-lias-border rounded-xl p-5.5 mb-7">
            <div className="text-sm font-semibold text-lias-navy mb-4">Soumettre une demande de matériel</div>
            <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
              <TextField
                label="Article souhaité"
                required
                value={reqForm.itemName}
                onChange={(e) => setReqForm({ ...reqForm, itemName: e.target.value })}
              />
              <TextField
                label="Quantité"
                type="number"
                min={1}
                value={reqForm.quantity}
                onChange={(e) => setReqForm({ ...reqForm, quantity: e.target.value })}
              />
              <TextAreaField
                label="Description / justification"
                rows={1}
                value={reqForm.description}
                onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })}
              />
              <button
                type="submit"
                disabled={submittingReq || !reqForm.itemName}
                className="col-span-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submittingReq && <Loader2 size={14} className="animate-spin" />}
                Envoyer la demande
              </button>
            </form>
          </div>

          {requestsError && (
            <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
              <AlertCircle size={16} />
              {requestsError}
            </div>
          )}

          {canDecideRequests && (
            <div className="bg-white border border-lias-border rounded-xl overflow-hidden mb-7">
              <div className="flex items-center gap-2 px-5.5 py-4 border-b border-lias-border-light text-sm font-semibold text-lias-navy">
                <ClipboardList size={16} />
                Demandes en attente de validation
              </div>
              {requestsLoading ? (
                <div className="px-5.5 py-6 text-center text-sm text-lias-muted">Chargement...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="px-5.5 py-6 text-center text-sm text-lias-muted">Aucune demande en attente.</div>
              ) : (
                <ul className="list-none p-0 m-0">
                  {pendingRequests.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between px-5.5 py-3.5 border-t border-lias-border-light"
                    >
                      <div>
                        <div className="text-[13px] font-medium text-lias-ink">
                          {r.itemName} ({r.quantity}) — {r.requesterName}
                        </div>
                        {r.description && <div className="text-[12px] text-lias-muted">{r.description}</div>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecide(r.id, 'approve')}
                          disabled={decidingId === r.id}
                          className="bg-lias-success text-white border-none rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleDecide(r.id, 'reject')}
                          disabled={decidingId === r.id}
                          className="bg-white text-lias-danger-text border border-lias-danger-bg rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
            <div className="px-5.5 py-4 border-b border-lias-border-light text-sm font-semibold text-lias-navy">
              Mes demandes
            </div>
            {requestsLoading ? (
              <div className="px-5.5 py-6 text-center text-sm text-lias-muted">Chargement...</div>
            ) : myRequests.length === 0 ? (
              <div className="px-5.5 py-6 text-center text-sm text-lias-muted">
                Vous n'avez soumis aucune demande.
              </div>
            ) : (
              <ul className="list-none p-0 m-0">
                {myRequests.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-5.5 py-3.5 border-t border-lias-border-light"
                  >
                    <div className="text-[13px] text-lias-ink">
                      {r.itemName} ({r.quantity})
                    </div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${STATUS_BADGE[r.status]}`}>
                      {STATUS_LABEL_FR[r.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <EquipmentFormModal
        open={formOpen}
        equipment={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadEquipment}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer le matériel"
        message={`Voulez-vous vraiment supprimer "${deleteTarget?.name}" ?`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
