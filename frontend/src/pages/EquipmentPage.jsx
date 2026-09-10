import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  Users,
  Send,
  PackageCheck,
  Boxes,
  Check,
  X,
} from 'lucide-react';
import EquipmentFormModal from '../components/EquipmentFormModal';
import EquipmentDistributionModal from '../components/EquipmentDistributionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TextField, TextAreaField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  CardHeader,
  Toolbar,
  SearchInput,
  StatTile,
  Tabs,
  Button,
  IconButton,
  Badge,
  RequestStatusBadge,
  Alert,
  EmptyState,
  LoadingBlock,
  TableSkeleton,
  Table,
  THead,
  TBody,
  TR,
  TD,
  TDPrimary,
  TDActions,
} from '../components/ui';
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

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/**
 * Availability is derived strictly from the two quantities the backend keeps
 * (`quantity` and `availableQuantity`) — no invented lifecycle states.
 */
function availabilityOf(item) {
  if (item.quantity === 0) return { tone: 'neutral', label: 'Non renseigné', ratio: 0 };
  const ratio = item.availableQuantity / item.quantity;
  if (item.availableQuantity === 0) return { tone: 'danger', label: 'Épuisé', ratio };
  if (ratio < 1) return { tone: 'warning', label: 'Partiellement distribué', ratio };
  return { tone: 'success', label: 'Entièrement disponible', ratio };
}

const BAR_COLOR = {
  success: 'bg-lias-success',
  warning: 'bg-lias-warning',
  danger: 'bg-lias-danger',
  neutral: 'bg-lias-border-strong',
};

export default function EquipmentPage({ user }) {
  const canManageInventory = hasRole(user, EQUIPMENT_ADMIN_ROLES);
  const canDecideRequests = hasRole(user, EQUIPMENT_DECISION_ROLES);

  const [tab, setTab] = useState(canManageInventory ? 'inventory' : 'requests');
  const toast = useToasts();

  const [equipment, setEquipment] = useState([]);
  const [equipLoading, setEquipLoading] = useState(true);
  const [equipError, setEquipError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [distributionTarget, setDistributionTarget] = useState(null);

  const [myRequests, setMyRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);
  const [reqForm, setReqForm] = useState({ itemName: '', description: '', quantity: 1 });
  const [submittingReq, setSubmittingReq] = useState(false);
  const [decidingId, setDecidingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadEquipment = useCallback(() => {
    setEquipLoading(true);
    setEquipError(null);
    searchEquipment({ query: debouncedSearch || undefined })
      .then((res) => setEquipment(res.content))
      .catch((err) => setEquipError(friendlyError(err, 'Échec du chargement du matériel')))
      .finally(() => setEquipLoading(false));
  }, [debouncedSearch]);

  const loadRequests = useCallback(() => {
    setRequestsLoading(true);
    setRequestsError(null);
    // Technical accounts (SYSTEM_ADMIN, or a DIRECTOR/VICE_DIRECTOR created directly
    // via user administration) have no linked Member profile, so "mine" 404s for them.
    // Load both independently so one failing doesn't blank out the other.
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

  const stats = useMemo(() => {
    const totalUnits = equipment.reduce((s, e) => s + (e.quantity ?? 0), 0);
    const availableUnits = equipment.reduce((s, e) => s + (e.availableQuantity ?? 0), 0);
    const outOfStock = equipment.filter((e) => e.quantity > 0 && e.availableQuantity === 0).length;
    return { totalUnits, availableUnits, distributed: totalUnits - availableUnits, outOfStock };
  }, [equipment]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEquipment(deleteTarget.id);
      toast.success('Matériel archivé.');
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
      toast.success('Demande soumise — la direction en a été notifiée.');
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

  const tabs = [
    ...(canManageInventory ? [{ key: 'inventory', label: 'Inventaire', icon: Boxes }] : []),
    {
      key: 'requests',
      label: 'Demandes',
      icon: ClipboardList,
      count: canDecideRequests ? pendingRequests.length : 0,
    },
  ];

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Ressources matérielles"
        title="Gestion du matériel"
        description="Inventaire, arrivages, distribution équitable aux membres et suivi des demandes soumises à la direction."
        actions={<Tabs tabs={tabs} active={tab} onChange={setTab} />}
      />

      {/* ------------------------- Inventaire ------------------------- */}
      {tab === 'inventory' && canManageInventory && (
        <>
          {equipError && (
            <Alert tone="danger" className="mb-5">
              {equipError}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatTile
              label="Références en inventaire"
              value={equipment.length}
              icon={Package}
              loading={equipLoading}
            />
            <StatTile
              label="Unités disponibles"
              value={stats.availableUnits}
              hint={`sur ${stats.totalUnits} au total`}
              icon={PackageCheck}
              loading={equipLoading}
            />
            <StatTile
              label="Unités distribuées"
              value={stats.distributed}
              hint="Actuellement chez des membres"
              icon={Users}
              loading={equipLoading}
            />
            <StatTile
              label="Références épuisées"
              value={stats.outOfStock}
              hint={stats.outOfStock > 0 ? 'Stock entièrement distribué' : 'Aucune rupture'}
              hintTone={stats.outOfStock > 0 ? 'warning' : 'success'}
              icon={Boxes}
              loading={equipLoading}
            />
          </div>

          <Card>
            <Toolbar>
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un matériel..."
                className="w-full sm:w-72"
              />
              <div className="sm:ml-auto">
                <Button
                  icon={Plus}
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  Ajouter du matériel
                </Button>
              </div>
            </Toolbar>

            {equipLoading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : equipment.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucun matériel enregistré"
                description={
                  debouncedSearch
                    ? 'Aucun matériel ne correspond à cette recherche.'
                    : "Enregistrez les arrivages du laboratoire pour suivre leur distribution."
                }
                action={
                  !debouncedSearch ? (
                    <Button
                      icon={Plus}
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      Ajouter du matériel
                    </Button>
                  ) : null
                }
              />
            ) : (
              <Table minWidth="min-w-[860px]">
                <THead
                  columns={[
                    'Matériel',
                    'Catégorie',
                    'Arrivage',
                    'Disponibilité',
                    { label: 'Actions', align: 'right' },
                  ]}
                />
                <TBody>
                  {equipment.map((item) => {
                    const availability = availabilityOf(item);
                    return (
                      <TR key={item.id}>
                        <TDPrimary title={item.name} subtitle={item.description} />
                        <TD className="text-lias-muted">{item.category || '—'}</TD>
                        <TD className="text-lias-muted font-mono text-[12.5px]">
                          {item.arrivalDate ? new Date(item.arrivalDate).toLocaleDateString('fr-FR') : '—'}
                        </TD>
                        <TD>
                          <div className="min-w-[170px]">
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <Badge tone={availability.tone} size="sm">
                                {availability.label}
                              </Badge>
                              <span className="text-[12px] font-mono font-semibold text-lias-navy tabular-nums">
                                {item.availableQuantity}/{item.quantity}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-lias-surface-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-[width] duration-300 ${BAR_COLOR[availability.tone]}`}
                                style={{ width: `${Math.round(availability.ratio * 100)}%` }}
                              />
                            </div>
                          </div>
                        </TD>
                        <TDActions>
                          <IconButton
                            icon={Users}
                            label="Registre de distribution"
                            onClick={() => setDistributionTarget(item)}
                          />
                          <IconButton
                            icon={Pencil}
                            label="Modifier"
                            onClick={() => {
                              setEditing(item);
                              setFormOpen(true);
                            }}
                          />
                          <IconButton
                            icon={Trash2}
                            label="Archiver"
                            variant="danger"
                            onClick={() => setDeleteTarget(item)}
                          />
                        </TDActions>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* ------------------------- Demandes ------------------------- */}
      {tab === 'requests' && (
        <>
          <Card className="mb-5" padded>
            <div className="flex items-center gap-2 text-[13.5px] font-semibold text-lias-navy mb-1.5">
              <Send size={15} className="text-lias-blue-dark" />
              Soumettre une demande de matériel
            </div>
            <p className="text-[12.5px] text-lias-muted mt-0 mb-4">
              Votre demande est transmise à la direction, qui l'accepte ou la refuse (CdC §2.15).
            </p>
            <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
              <TextField
                label="Article souhaité"
                required
                value={reqForm.itemName}
                onChange={(e) => setReqForm({ ...reqForm, itemName: e.target.value })}
                placeholder="Ex. Station de calcul GPU"
              />
              <TextField
                label="Quantité"
                type="number"
                min={1}
                value={reqForm.quantity}
                onChange={(e) => setReqForm({ ...reqForm, quantity: e.target.value })}
              />
              <TextAreaField
                label="Justification"
                rows={1}
                value={reqForm.description}
                onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })}
                placeholder="Usage prévu, projet concerné..."
              />
              <Button
                type="submit"
                icon={Send}
                className="sm:col-start-3"
                loading={submittingReq}
                disabled={!reqForm.itemName}
              >
                Envoyer la demande
              </Button>
            </form>
          </Card>

          {requestsError && (
            <Alert tone="danger" className="mb-5">
              {requestsError}
            </Alert>
          )}

          {canDecideRequests && (
            <Card className="mb-5">
              <CardHeader
                icon={ClipboardList}
                title="Demandes en attente de validation"
                description="Seuls le directeur et le vice-directeur peuvent décider (CdC §2.15)."
              />
              {requestsLoading ? (
                <LoadingBlock label="Chargement des demandes..." />
              ) : pendingRequests.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Aucune demande en attente"
                  description="Toutes les demandes de matériel ont été traitées."
                />
              ) : (
                <ul className="list-none p-0 m-0">
                  {pendingRequests.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5.5 py-4
                        border-b border-lias-border-light last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium text-lias-ink">
                          {r.itemName}{' '}
                          <span className="text-lias-muted font-normal">× {r.quantity}</span>
                        </div>
                        <div className="text-[12px] text-lias-muted mt-0.5">
                          Demandé par {r.requesterName}
                        </div>
                        {r.description && (
                          <p className="text-[12.5px] text-lias-muted mt-1.5 mb-0 leading-snug">{r.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          icon={Check}
                          loading={decidingId === r.id}
                          onClick={() => handleDecide(r.id, 'approve')}
                        >
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={X}
                          disabled={decidingId === r.id}
                          onClick={() => handleDecide(r.id, 'reject')}
                        >
                          Refuser
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card>
            <CardHeader icon={Package} title="Mes demandes" description="Historique de vos demandes et de leurs décisions." />
            {requestsLoading ? (
              <LoadingBlock label="Chargement..." />
            ) : myRequests.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucune demande soumise"
                description="Utilisez le formulaire ci-dessus pour demander du matériel au laboratoire."
              />
            ) : (
              <Table minWidth="min-w-[640px]">
                <THead
                  columns={['Article', 'Quantité', 'État', { label: 'Décision', align: 'right' }]}
                />
                <TBody>
                  {myRequests.map((r) => (
                    <TR key={r.id}>
                      <TDPrimary title={r.itemName} subtitle={r.description} />
                      <TD className="text-lias-muted font-mono">{r.quantity}</TD>
                      <TD>
                        <RequestStatusBadge status={r.status} size="sm" />
                      </TD>
                      <TD align="right" className="text-lias-muted text-[12.5px]">
                        {r.validationDate
                          ? new Date(r.validationDate).toLocaleDateString('fr-FR')
                          : 'En attente'}
                        {r.validationNote && (
                          <div className="text-[11.5px] text-lias-faint mt-0.5">{r.validationNote}</div>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </>
      )}

      <EquipmentFormModal
        open={formOpen}
        equipment={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadEquipment}
        toast={toast}
      />

      <EquipmentDistributionModal
        equipment={distributionTarget}
        canDistribute={canManageInventory}
        onClose={() => setDistributionTarget(null)}
        onChanged={loadEquipment}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archiver ce matériel"
        message={`« ${deleteTarget?.name} » sera archivé (suppression logique). L'historique des distributions est conservé.`}
        confirmLabel="Archiver"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
