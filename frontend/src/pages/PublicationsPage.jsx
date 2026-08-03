import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Search, AlertCircle, Pencil, Trash2, FileText } from 'lucide-react';
import StatCard from '../components/StatCard';
import PublicationFormModal from '../components/PublicationFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastStack, useToasts } from '../components/Toast';
import { searchPublications, deletePublication } from '../services/publicationService';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

function TableSkeleton() {
  return (
    <div className="px-5.5 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-lias-border-light last:border-b-0">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-64 bg-lias-bg rounded animate-pulse" />
            <div className="h-2.5 w-40 bg-lias-bg rounded animate-pulse" />
          </div>
          <div className="h-3 w-14 bg-lias-bg rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function PublicationsPage() {
  const [publications, setPublications] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToasts();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadPublications = useCallback(() => {
    setLoading(true);
    setError(null);
    searchPublications({
      query: debouncedSearch || undefined,
      year: yearFilter ? Number(yearFilter) : undefined,
      page: 0,
      size: 50,
      sort: 'year,desc',
    })
      .then((res) => {
        setPublications(res.content);
        setTotalElements(res.totalElements);
      })
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des publications')))
      .finally(() => setLoading(false));
  }, [debouncedSearch, yearFilter]);

  useEffect(() => {
    loadPublications();
  }, [loadPublications]);

  const thisYearCount = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return publications.filter((p) => p.year === currentYear).length;
  }, [publications]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(pub) {
    setEditing(pub);
    setFormOpen(true);
  }

  function handleSaved() {
    loadPublications();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePublication(deleteTarget.id);
      toast.success('Publication supprimée.');
      setDeleteTarget(null);
      loadPublications();
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
          <h1 className="m-0 text-[22px] font-bold text-lias-navy">Publications Scientifiques</h1>
          <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
            Gérez les publications du laboratoire : création, auteurs, PDF.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-lias-blue text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Nouvelle publication
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 mb-7">
        <StatCard label="Total Publications" value={totalElements} icon={BookOpen} loading={loading} />
        <StatCard label="Cette année" value={thisYearCount} icon={FileText} loading={loading} />
      </div>

      <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5.5 py-4 border-b border-lias-border-light">
          <div className="flex items-center gap-2.5 bg-lias-bg border border-lias-border rounded-lg px-3 py-2 w-full sm:w-72">
            <Search size={15} className="text-lias-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, mots-clés..."
              className="border-none outline-none bg-transparent text-[13px] w-full text-lias-ink"
            />
          </div>
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="Année"
            className="border border-lias-border rounded-lg px-3 py-2 text-[13px] w-full sm:w-28 outline-none"
          />
        </div>

        {loading ? (
          <TableSkeleton />
        ) : publications.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-lias-muted text-sm">
            Aucune publication ne correspond à ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-lias-bg">
                  {['Titre', 'Auteurs', 'Équipe', 'Année', ''].map((h, i) => (
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
                {publications.map((p) => (
                  <tr key={p.id} className="border-t border-lias-border-light">
                    <td className="px-5.5 py-3.5">
                      <div className="text-[13px] font-medium text-lias-ink">{p.title}</div>
                      {p.doi && <div className="text-[11.5px] text-lias-muted font-mono">{p.doi}</div>}
                    </td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">
                      {p.authors?.map((a) => a.fullName).join(', ') || '—'}
                    </td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{p.teamName || '—'}</td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted font-mono">{p.year}</td>
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

      <PublicationFormModal
        open={formOpen}
        publication={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer la publication"
        message={`Voulez-vous vraiment supprimer "${deleteTarget?.title}" ?`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
