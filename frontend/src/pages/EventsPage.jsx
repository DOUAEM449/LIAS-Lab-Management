import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Users,
  CalendarClock,
  CalendarCheck,
  UserPlus,
  Presentation,
} from 'lucide-react';
import EventFormModal from '../components/EventFormModal';
import EventParticipantsModal from '../components/EventParticipantsModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  Toolbar,
  SearchInput,
  StatTile,
  Button,
  IconButton,
  Badge,
  Alert,
  EmptyState,
  Skeleton,
} from '../components/ui';
import { searchEvents, deleteEvent, registerForEvent } from '../services/eventService';
import { getMyProfile } from '../services/memberService';
import { EVENT_MEETING_CREATE_ROLES, MANAGEMENT_ROLES, hasRole } from '../utils/roles';

const TYPE_LABEL_FR = { CONFERENCE: 'Conférence', WORKSHOP: 'Workshop', SEMINAR: 'Séminaire' };
const TYPE_TONE = { CONFERENCE: 'info', WORKSHOP: 'warning', SEMINAR: 'mandate' };

function friendlyError(err, fallback) {
  if (err.response?.status === 409) return 'Vous êtes déjà inscrit(e) à cet événement.';
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function EventsPage({ user }) {
  const canCreate = hasRole(user, EVENT_MEETING_CREATE_ROLES);
  const canDelete = hasRole(user, MANAGEMENT_ROLES);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [when, setWhen] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [participantsTarget, setParticipantsTarget] = useState(null);
  const [registeringId, setRegisteringId] = useState(null);
  const [currentMemberId, setCurrentMemberId] = useState(null);

  const toast = useToasts();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadEvents = useCallback(() => {
    setLoading(true);
    setError(null);
    searchEvents({ query: debouncedSearch || undefined, type: typeFilter || undefined, size: 60 })
      .then((res) => setEvents(res.content))
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des événements')))
      .finally(() => setLoading(false));
  }, [debouncedSearch, typeFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    // Technical accounts have no Member profile (`user.status` null) — registration
    // is simply hidden for them, and the lookup is skipped to avoid a 404.
    if (!user?.status) {
      setCurrentMemberId(null);
      return;
    }
    getMyProfile()
      .then((prof) => setCurrentMemberId(prof.id))
      .catch(() => setCurrentMemberId(null));
  }, [user]);

  const now = new Date();
  const upcoming = useMemo(() => events.filter((e) => new Date(e.startDate) >= now), [events]); // eslint-disable-line react-hooks/exhaustive-deps
  const thisYear = useMemo(
    () => events.filter((e) => new Date(e.startDate).getFullYear() === now.getFullYear()),
    [events] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const visible = useMemo(() => {
    const list =
      when === 'upcoming'
        ? events.filter((e) => new Date(e.startDate) >= now)
        : when === 'past'
          ? events.filter((e) => new Date(e.startDate) < now)
          : events;
    return [...list].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [events, when]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      toast.success('Événement archivé.');
      setDeleteTarget(null);
      loadEvents();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la suppression'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleRegister(event) {
    if (!currentMemberId) return;
    setRegisteringId(event.id);
    try {
      await registerForEvent(event.id, currentMemberId);
      toast.success(`Inscription confirmée pour « ${event.title} ».`);
      loadEvents();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'inscription"));
    } finally {
      setRegisteringId(null);
    }
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Activité scientifique"
        title="Événements scientifiques"
        description="Conférences, workshops et séminaires organisés ou accueillis par le laboratoire. Chaque édition est archivée avec ses organisateurs et ses participants."
        actions={
          canCreate && (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Nouvel événement
            </Button>
          )
        }
      />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Événements enregistrés" value={events.length} icon={Calendar} loading={loading} />
        <StatTile
          label="À venir"
          value={upcoming.length}
          hint={upcoming.length > 0 ? 'Prochainement au laboratoire' : 'Aucun événement programmé'}
          hintTone={upcoming.length > 0 ? 'success' : 'muted'}
          icon={CalendarClock}
          loading={loading}
        />
        <StatTile label="Cette année" value={thisYear.length} icon={CalendarCheck} loading={loading} />
      </div>

      <Card className="mb-5">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un événement..."
            className="w-full sm:w-72"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-lias-border rounded-lg px-3 py-2 text-[13px] outline-none bg-lias-surface
              cursor-pointer hover:border-lias-border-strong focus:border-lias-blue transition-colors duration-150"
          >
            <option value="">Tous les types</option>
            <option value="CONFERENCE">Conférence</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="SEMINAR">Séminaire</option>
          </select>
          <select
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="border border-lias-border rounded-lg px-3 py-2 text-[13px] outline-none bg-lias-surface
              cursor-pointer hover:border-lias-border-strong focus:border-lias-blue transition-colors duration-150"
          >
            <option value="all">Toutes les périodes</option>
            <option value="upcoming">À venir</option>
            <option value="past">Passés</option>
          </select>
          <div className="sm:ml-auto text-[12.5px] text-lias-muted">
            {loading ? '—' : `${visible.length} événement(s)`}
          </div>
        </Toolbar>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="Aucun événement"
            description={
              debouncedSearch || typeFilter || when !== 'all'
                ? 'Aucun événement ne correspond à ces critères.'
                : "Le laboratoire n'a pas encore enregistré d'événement scientifique."
            }
            action={
              canCreate && !debouncedSearch ? (
                <Button
                  icon={Plus}
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  Créer un événement
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {visible.map((e) => {
            const start = new Date(e.startDate);
            const isPast = start < now;
            return (
              <Card key={e.id} className="p-5 flex flex-col">
                <div className="flex items-start gap-5">
                  <div
                    className={`w-16 shrink-0 rounded-lg py-3 text-center border
                      ${isPast ? 'bg-lias-surface-muted border-lias-border-light' : 'bg-lias-blue-tint-solid border-transparent'}`}
                  >
                    <div className="text-[10.5px] uppercase font-semibold tracking-wide text-lias-muted">
                      {start.toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                    <div className="text-[22px] font-bold text-lias-navy leading-none mt-1 tabular-nums">
                      {start.getDate()}
                    </div>
                    <div className="text-[10.5px] text-lias-faint font-mono mt-1">{start.getFullYear()}</div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge tone={TYPE_TONE[e.type] ?? 'info'} size="sm">
                        {TYPE_LABEL_FR[e.type] || e.type}
                      </Badge>
                      {e.editionNumber && (
                        <Badge tone="outline" size="sm">
                          {e.editionNumber}ᵉ édition
                        </Badge>
                      )}
                      {isPast && (
                        <Badge tone="neutral" size="sm">
                          Archivé
                        </Badge>
                      )}
                    </div>

                    <h3 className="m-0 text-[15px] font-semibold text-lias-navy leading-snug">{e.title}</h3>
                    {e.description && (
                      <p className="mt-1.5 mb-0 text-[12.5px] text-lias-muted leading-relaxed line-clamp-2">
                        {e.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-[12px] text-lias-muted">
                      <span className="flex items-center gap-1.5 font-mono">
                        <CalendarClock size={12} />
                        {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {e.location && (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{e.location}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users size={12} />
                        {e.participantCount} participant(s)
                      </span>
                    </div>

                    {e.organizers?.length > 0 && (
                      <div className="flex items-center gap-2 mt-2.5 text-[12px] text-lias-muted min-w-0">
                        <Presentation size={12} className="shrink-0" />
                        <span className="truncate">
                          Organisé par {e.organizers.map((o) => o.fullName).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-lias-border-light">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" icon={Users} onClick={() => setParticipantsTarget(e)}>
                      Participants
                    </Button>
                    {currentMemberId && !isPast && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={UserPlus}
                        loading={registeringId === e.id}
                        onClick={() => handleRegister(e)}
                      >
                        S'inscrire
                      </Button>
                    )}
                  </div>

                  {canCreate && (
                    <div className="flex gap-2">
                      <IconButton
                        icon={Pencil}
                        label="Modifier"
                        onClick={() => {
                          setEditing(e);
                          setFormOpen(true);
                        }}
                      />
                      {canDelete && (
                        <IconButton
                          icon={Trash2}
                          label="Archiver"
                          variant="danger"
                          onClick={() => setDeleteTarget(e)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <EventFormModal
        open={formOpen}
        event={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadEvents}
        toast={toast}
        currentMemberId={currentMemberId}
      />

      <EventParticipantsModal
        event={participantsTarget}
        onClose={() => setParticipantsTarget(null)}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archiver l'événement"
        message={`« ${deleteTarget?.title} » sera archivé (suppression logique). Participants, organisateurs et documents associés restent conservés.`}
        confirmLabel="Archiver"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
