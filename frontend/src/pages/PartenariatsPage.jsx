import { useCallback, useEffect, useState } from 'react';
import { Handshake, Plus, Search, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import PartnerFormModal from '../components/PartnerFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastStack, useToasts } from '../components/Toast';
import { searchPartners, deletePartner } from '../services/partnershipService';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function PartenariatsPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToasts();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadPartners = useCallback(() => {
    setLoading(true);
    setError(null);
    searchPartners({ query: debouncedSearch || undefined })
      .then((res) => setPartners(res.content))
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des partenaires')))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setFormOpen(true);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePartner(deleteTarget.id);
      toast.success('Partenaire supprimé.');
      setDeleteTarget(null);
      loadPartners();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la suppression'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="m-0 text-[22px] font-bold text-lias-navy">Conventions & Partenariats</h1>
          <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
            Gérez les partenaires institutionnels et industriels ainsi que leurs conventions.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-lias-blue text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Nouveau partenaire
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="mb-7 max-w-xs">
        <StatCard label="Total Partenaires" value={partners.length} icon={Handshake} loading={loading} />
      </div>

      <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
        <div className="px-5.5 py-4 border-b border-lias-border-light">
          <div className="flex items-center gap-2.5 bg-lias-bg border border-lias-border rounded-lg px-3 py-2 w-full sm:w-72">
            <Search size={15} className="text-lias-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un partenaire..."
              className="border-none outline-none bg-transparent text-[13px] w-full text-lias-ink"
            />
          </div>
        </div>

        {loading ? (
          <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Chargement...</div>
        ) : partners.length === 0 ? (
          <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Aucun partenaire.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-lias-bg">
                  {['Partenaire', 'Type', 'Pays', 'Contact', ''].map((h, i) => (
                    <th
                      key={h + i}
                      className={`text-[11.5px] font-semibold text-lias-muted uppercase tracking-wider py-3 ${
                        i === 4 ? 'px-5.5 text-right' : 'px-5.5 text-left'
                      }`}
                    >
                      {i === 4 ? 'Actions' : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-t border-lias-border-light">
                    <td className="px-5.5 py-3.5 text-[13px] font-medium text-lias-ink">{p.name}</td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{p.type || '—'}</td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{p.country || '—'}</td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{p.contactInfo || '—'}</td>
                    <td className="px-5.5 py-3.5 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="w-8 h-8 rounded-lg border border-lias-border bg-white cursor-pointer flex items-center justify-center text-lias-muted hover:text-lias-blue-dark"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
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

      <PartnerFormModal
        open={formOpen}
        partner={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadPartners}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer le partenaire"
        message={`Voulez-vous vraiment supprimer "${deleteTarget?.name}" ?`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
