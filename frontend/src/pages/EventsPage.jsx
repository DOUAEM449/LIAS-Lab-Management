import { useCallback, useEffect, useState } from 'react';
import { Calendar, Plus, Search, AlertCircle, Pencil, Trash2, MapPin, Users } from 'lucide-react';
import StatCard from '../components/StatCard';
import EventFormModal from '../components/EventFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastStack, useToasts } from '../components/Toast';
import { searchEvents, deleteEvent } from '../services/eventService';
import { getMyProfile } from '../services/memberService';
import { isManagement } from '../utils/roles';

const TYPE_LABEL_FR = { CONFERENCE: 'Conférence', WORKSHOP: 'Workshop', SEMINAR: 'Séminaire' };
const TYPE_BADGE = {
  CONFERENCE: 'bg-blue-100 text-blue-700',
  WORKSHOP: 'bg-amber-100 text-amber-700',
  SEMINAR: 'bg-violet-100 text-violet-700',
};

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function EventsPage({ user }) {
  const canCreate = isManagement(user) || user?.role === 'TEAM_LEADER';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState(null);

  const toast = useToasts();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadEvents = useCallback(() => {
    setLoading(true);
    setError(null);
    searchEvents({ query: debouncedSearch || undefined, type: typeFilter || undefined })
      .then((res) => setEvents(res.content))
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des événements')))
      .finally(() => setLoading(false));
  }, [debouncedSearch, typeFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    getMyProfile()
      .then((p) => setCurrentMemberId(p.id))
      .catch(() => {});
  }, []);

  const upcomingCount = events.filter((e) => new Date(e.startDate) > new Date()).length;
  const thisYearCount = events.filter(
    (e) => new Date(e.startDate).getFullYear() === new Date().getFullYear()
  ).length;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(event) {
    setEditing(event);
    setFormOpen(true);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      toast.success('Événement supprimé.');
      setDeleteTarget(null);
      loadEvents();
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
          <h1 className="m-0 text-[22px] font-bold text-lias-navy">Événements</h1>
          <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
            Conférences, workshops et séminaires organisés par le laboratoire.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-lias-blue text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus size={16} />
            Nouvel événement
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 mb-7">
        <StatCard label="Total Événements" value={events.length} icon={Calendar} loading={loading} />
        <StatCard label="À venir" value={upcomingCount} icon={Calendar} loading={loading} />
        <StatCard label="Cette année" value={thisYearCount} icon={Calendar} loading={loading} />
      </div>

      <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5.5 py-4 border-b border-lias-border-light">
          <div className="flex items-center gap-2.5 bg-lias-bg border border-lias-border rounded-lg px-3 py-2 w-full sm:w-72">
            <Search size={15} className="text-lias-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un événement..."
              className="border-none outline-none bg-transparent text-[13px] w-full text-lias-ink"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-lias-border rounded-lg px-3 py-2 text-[13px] outline-none"
          >
            <option value="">Tous les types</option>
            <option value="CONFERENCE">Conférence</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="SEMINAR">Séminaire</option>
          </select>
        </div>

        {loading ? (
          <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Chargement...</div>
        ) : events.length === 0 ? (
          <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Aucun événement.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-lias-bg">
                  {['Événement', 'Type', 'Date', 'Lieu', 'Participants', ''].map((h, i) => (
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
                {events.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => openEdit(e)}
                    className="border-t border-lias-border-light cursor-pointer hover:bg-lias-bg/60"
                  >
                    <td className="px-5.5 py-3.5 text-[13px] font-medium text-lias-ink">{e.title}</td>
                    <td className="px-5.5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${TYPE_BADGE[e.type]}`}>
                        {TYPE_LABEL_FR[e.type] || e.type}
                      </span>
                    </td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted font-mono">
                      {new Date(e.startDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">
                      {e.location ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={12} /> {e.location}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">
                      <span className="flex items-center gap-1.5">
                        <Users size={12} /> {e.participantCount}
                      </span>
                    </td>
                    <td className="px-5.5 py-3.5 text-right" onClick={(ev) => ev.stopPropagation()}>
                      {canCreate && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEdit(e)}
                            className="w-8 h-8 rounded-lg border border-lias-border bg-white cursor-pointer flex items-center justify-center text-lias-muted hover:text-lias-blue-dark"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            className="w-8 h-8 rounded-lg border border-rose-200 bg-white cursor-pointer flex items-center justify-center text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EventFormModal
        open={formOpen}
        event={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadEvents}
        toast={toast}
        currentMemberId={currentMemberId}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer l'événement"
        message={`Voulez-vous vraiment supprimer "${deleteTarget?.title}" ?`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
