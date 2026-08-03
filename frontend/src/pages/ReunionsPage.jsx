import { useCallback, useEffect, useState } from 'react';
import { Calendar, Plus, AlertCircle, Pencil, Trash2, FileCheck, FileX } from 'lucide-react';
import StatCard from '../components/StatCard';
import MeetingFormModal from '../components/MeetingFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastStack, useToasts } from '../components/Toast';
import { listMeetings, deleteMeeting } from '../services/meetingService';

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
            <div className="h-3 w-56 bg-lias-bg rounded animate-pulse" />
            <div className="h-2.5 w-32 bg-lias-bg rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReunionsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToasts();

  const loadMeetings = useCallback(() => {
    setLoading(true);
    setError(null);
    listMeetings()
      .then((res) => setMeetings(res.content))
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des réunions')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const upcomingCount = meetings.filter((m) => new Date(m.meetingDate) > new Date()).length;
  const withMinutesCount = meetings.filter((m) => m.hasMinutes).length;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(meeting) {
    setEditing(meeting);
    setFormOpen(true);
  }

  function handleSaved() {
    loadMeetings();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMeeting(deleteTarget.id);
      toast.success('Réunion supprimée.');
      setDeleteTarget(null);
      loadMeetings();
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
          <h1 className="m-0 text-[22px] font-bold text-lias-navy">PV & Réunions</h1>
          <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
            Planifiez les réunions internes et archivez leurs procès-verbaux.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-lias-blue text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Nouvelle réunion
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 mb-7">
        <StatCard label="Total Réunions" value={meetings.length} icon={Calendar} loading={loading} />
        <StatCard label="À venir" value={upcomingCount} icon={Calendar} loading={loading} />
        <StatCard label="Avec PV archivé" value={withMinutesCount} icon={FileCheck} loading={loading} />
      </div>

      <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : meetings.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-lias-muted text-sm">
            Aucune réunion planifiée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-lias-bg">
                  {['Titre', 'Date', 'Type', 'Lieu', 'PV', ''].map((h, i) => (
                    <th
                      key={h + i}
                      className={`text-[11.5px] font-semibold text-lias-muted uppercase tracking-wider py-3 ${
                        i === 5 ? 'px-5.5 text-right' : 'px-5.5 text-left'
                      }`}
                    >
                      {i === 5 ? 'Actions' : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => (
                  <tr key={m.id} className="border-t border-lias-border-light">
                    <td className="px-5.5 py-3.5 text-[13px] font-medium text-lias-ink">{m.title}</td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted font-mono">
                      {new Date(m.meetingDate).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{m.type || '—'}</td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{m.location || '—'}</td>
                    <td className="px-5.5 py-3.5">
                      {m.hasMinutes ? (
                        <FileCheck size={16} className="text-lias-success" />
                      ) : (
                        <FileX size={16} className="text-lias-muted" />
                      )}
                    </td>
                    <td className="px-5.5 py-3.5 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(m)}
                          className="w-8 h-8 rounded-lg border border-lias-border bg-white cursor-pointer flex items-center justify-center text-lias-muted hover:text-lias-blue-dark"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
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

      <MeetingFormModal
        open={formOpen}
        meeting={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer la réunion"
        message={`Voulez-vous vraiment supprimer "${deleteTarget?.title}" ?`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
