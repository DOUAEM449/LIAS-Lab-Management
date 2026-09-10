import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  MessageSquare,
  CheckCheck,
  Plus,
  Globe,
  Users2,
  Calendar,
  UserPlus,
  FileText,
  Package,
  BookOpen,
  ClipboardCheck,
  Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DiscussionThreadModal from '../components/DiscussionThreadModal';
import { TextField, SelectField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  CardHeader,
  Tabs,
  Button,
  Badge,
  Alert,
  EmptyState,
  LoadingBlock,
  StatTile,
} from '../components/ui';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';
import {
  listDiscussions,
  listTeamDiscussions,
  listEventDiscussions,
  createDiscussion,
} from '../services/discussionService';
import { listTeams } from '../services/governanceService';
import { listEventOptions } from '../services/eventService';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/* Each notification type gets an icon and, where it makes sense, a destination
   so a notice is a way into the work rather than a dead end. */
const NOTIFICATION_META = {
  MEMBERSHIP_REQUEST: { icon: UserPlus, tone: 'warning', to: '/admin/membership-requests' },
  MEMBERSHIP_DECISION: { icon: UserPlus, tone: 'success', to: '/admin/members' },
  DOCUMENT_ADDED: { icon: FileText, tone: 'info', to: '/admin/documents' },
  EVENT_CREATED: { icon: Calendar, tone: 'info', to: '/admin/events' },
  EVENT_REMINDER: { icon: Calendar, tone: 'warning', to: '/admin/calendar' },
  PUBLICATION_ADDED: { icon: BookOpen, tone: 'info', to: '/admin/publications' },
  EQUIPMENT_REQUEST: { icon: Package, tone: 'warning', to: '/admin/equipment' },
  EQUIPMENT_REQUEST_DECISION: { icon: Package, tone: 'success', to: '/admin/equipment' },
  MEETING_SCHEDULED: { icon: ClipboardCheck, tone: 'info', to: '/admin/meetings' },
  MESSAGE_RECEIVED: { icon: MessageSquare, tone: 'info', to: '/admin/notifications' },
  SYSTEM: { icon: Info, tone: 'neutral', to: null },
};

const SCOPES = [
  { key: 'GLOBAL', label: 'Laboratoire', icon: Globe, hint: 'Discussions ouvertes à tous les membres' },
  { key: 'TEAM', label: 'Par équipe', icon: Users2, hint: "Échanges internes à une équipe de recherche" },
  { key: 'EVENT', label: 'Par événement', icon: Calendar, hint: 'Échanges rattachés à un événement scientifique' },
];

export default function NotificationsPage({ user }) {
  const hasInbox = Boolean(user?.status);
  const [tab, setTab] = useState('notifications');
  const toast = useToasts();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const [scope, setScope] = useState('GLOBAL');
  const [discussions, setDiscussions] = useState([]);
  const [discLoading, setDiscLoading] = useState(true);
  const [discError, setDiscError] = useState(null);
  const [openDiscussion, setOpenDiscussion] = useState(null);

  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const loadNotifications = useCallback(() => {
    if (!hasInbox) {
      setNotifications([]);
      setNotifLoading(false);
      return;
    }
    setNotifLoading(true);
    setNotifError(null);
    listNotifications()
      .then((res) => setNotifications(res.content))
      .catch((err) => setNotifError(friendlyError(err, 'Échec du chargement des notifications')))
      .finally(() => setNotifLoading(false));
  }, [hasInbox]);

  // Team/event pickers feed both the listing and the creation form.
  useEffect(() => {
    listTeams()
      .then(setTeams)
      .catch(() => setTeams([]));
    listEventOptions()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const loadDiscussions = useCallback(() => {
    setDiscLoading(true);
    setDiscError(null);

    // TEAM / EVENT threads are scoped to one team or one event; until the user
    // picks one there is nothing meaningful to list.
    let request;
    if (scope === 'TEAM') {
      request = selectedTeam ? listTeamDiscussions(selectedTeam) : Promise.resolve([]);
    } else if (scope === 'EVENT') {
      request = selectedEvent ? listEventDiscussions(selectedEvent) : Promise.resolve([]);
    } else {
      request = listDiscussions('GLOBAL').then((res) => res.content);
    }

    request
      .then(setDiscussions)
      .catch((err) => setDiscError(friendlyError(err, 'Échec du chargement des discussions')))
      .finally(() => setDiscLoading(false));
  }, [scope, selectedTeam, selectedEvent]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  async function handleMarkRead(n) {
    if (n.read) return;
    try {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    } catch (err) {
      toast.error(friendlyError(err, 'Échec'));
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Toutes les notifications ont été marquées comme lues.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec'));
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleCreateDiscussion(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (scope === 'TEAM' && !selectedTeam) {
      toast.error('Sélectionnez une équipe pour cette discussion.');
      return;
    }
    if (scope === 'EVENT' && !selectedEvent) {
      toast.error('Sélectionnez un événement pour cette discussion.');
      return;
    }

    setCreating(true);
    try {
      await createDiscussion({
        title: newTitle.trim(),
        scope,
        teamId: scope === 'TEAM' ? selectedTeam : null,
        eventId: scope === 'EVENT' ? selectedEvent : null,
      });
      setNewTitle('');
      toast.success('Discussion créée.');
      loadDiscussions();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la création de la discussion'));
    } finally {
      setCreating(false);
    }
  }

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const activeScope = SCOPES.find((s) => s.key === scope);
  const needsContext =
    (scope === 'TEAM' && !selectedTeam) || (scope === 'EVENT' && !selectedEvent);

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Communication interne"
        title="Notifications & discussions"
        description="Centre de notifications personnel et espaces d'échange du laboratoire : discussions générales, par équipe de recherche et rattachées aux événements scientifiques."
        actions={
          <Tabs
            tabs={[
              { key: 'notifications', label: 'Notifications', icon: Bell, count: unreadCount },
              { key: 'discussions', label: 'Discussions', icon: MessageSquare },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      />

      {tab === 'notifications' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatTile
              label="Notifications non lues"
              value={unreadCount}
              hint={unreadCount > 0 ? 'À consulter' : 'Vous êtes à jour'}
              hintTone={unreadCount > 0 ? 'warning' : 'success'}
              icon={Bell}
              loading={notifLoading}
            />
            <StatTile
              label="Notifications reçues"
              value={notifications.length}
              hint="Sur la période chargée"
              icon={CheckCheck}
              loading={notifLoading}
            />
          </div>

          <Card>
            <CardHeader
              icon={Bell}
              title="Mes notifications"
              description="Adhésions, événements, documents et demandes de matériel vous concernant."
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={CheckCheck}
                  onClick={handleMarkAll}
                  loading={markingAll}
                  disabled={unreadCount === 0}
                >
                  Tout marquer comme lu
                </Button>
              }
            />

            {notifError && (
              <Alert tone="danger" className="m-5.5 mb-0">
                {notifError}
              </Alert>
            )}

            {notifLoading ? (
              <LoadingBlock label="Chargement des notifications..." />
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Aucune notification"
                description="Vous serez averti ici des nouvelles demandes d'adhésion, des événements, des documents archivés et des décisions vous concernant."
              />
            ) : (
              <ul className="list-none p-0 m-0">
                {notifications.map((n) => {
                  const meta = NOTIFICATION_META[n.type] ?? NOTIFICATION_META.SYSTEM;
                  const Icon = meta.icon;
                  return (
                    <li
                      key={n.id}
                      onClick={() => {
                        handleMarkRead(n);
                        if (meta.to) navigate(meta.to);
                      }}
                      className={`flex items-start gap-3.5 px-5.5 py-4 border-b border-lias-border-light last:border-b-0
                        cursor-pointer transition-colors duration-150 hover:bg-lias-surface-muted/60
                        ${n.read ? '' : 'bg-lias-blue-tint-solid/40'}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                          ${n.read ? 'bg-lias-surface-muted text-lias-faint' : 'bg-lias-blue-tint-solid text-lias-blue-dark'}`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`text-[13.5px] leading-snug ${n.read ? 'text-lias-ink-soft' : 'text-lias-ink font-medium'}`}
                          >
                            {n.message}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-lias-blue shrink-0 mt-1.5" aria-label="Non lue" />
                          )}
                        </div>
                        <div className="text-[11.5px] text-lias-faint mt-1.5 font-mono">
                          {new Date(n.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      {tab === 'discussions' && (
        <>
          {/* CdC §2.13: three distinct conversation spaces. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {SCOPES.map((s) => {
              const Icon = s.icon;
              const isActive = scope === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setScope(s.key)}
                  className={`text-left rounded-card border p-4 cursor-pointer transition-colors duration-150
                    ${
                      isActive
                        ? 'border-lias-blue bg-lias-blue-tint-solid'
                        : 'border-lias-border bg-lias-surface hover:border-lias-border-strong'
                    }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Icon size={16} className={isActive ? 'text-lias-blue-dark' : 'text-lias-muted'} />
                    <span
                      className={`text-[13.5px] font-semibold ${isActive ? 'text-lias-navy' : 'text-lias-ink'}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="m-0 text-[12px] text-lias-muted leading-snug">{s.hint}</p>
                </button>
              );
            })}
          </div>

          <Card className="mb-5" padded>
            <div className="flex items-center gap-2 text-[13.5px] font-semibold text-lias-navy mb-4">
              <Plus size={15} className="text-lias-blue-dark" />
              Nouvelle discussion — {activeScope?.label.toLowerCase()}
            </div>

            <form onSubmit={handleCreateDiscussion}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <TextField
                  label="Titre de la discussion"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex. Préparation du séminaire annuel"
                />

                {scope === 'TEAM' && (
                  <SelectField
                    label="Équipe de recherche"
                    required
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                  >
                    <option value="">— Sélectionner une équipe —</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </SelectField>
                )}

                {scope === 'EVENT' && (
                  <SelectField
                    label="Événement scientifique"
                    required
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                  >
                    <option value="">— Sélectionner un événement —</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </SelectField>
                )}
              </div>

              <Button type="submit" icon={Plus} loading={creating} disabled={!newTitle.trim()}>
                Créer la discussion
              </Button>
            </form>
          </Card>

          {discError && (
            <Alert tone="danger" className="mb-5">
              {discError}
            </Alert>
          )}

          <Card>
            <CardHeader
              icon={activeScope?.icon ?? MessageSquare}
              title={`Discussions — ${activeScope?.label}`}
              description={activeScope?.hint}
            />

            {discLoading ? (
              <LoadingBlock label="Chargement des discussions..." />
            ) : needsContext ? (
              <EmptyState
                icon={activeScope?.icon ?? MessageSquare}
                title={scope === 'TEAM' ? 'Sélectionnez une équipe' : 'Sélectionnez un événement'}
                description={
                  scope === 'TEAM'
                    ? 'Choisissez une équipe de recherche ci-dessus pour afficher ses échanges internes.'
                    : 'Choisissez un événement scientifique ci-dessus pour afficher les échanges qui lui sont rattachés.'
                }
              />
            ) : discussions.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Aucune discussion"
                description="Aucun échange n'a encore été ouvert dans cet espace. Créez la première discussion ci-dessus."
              />
            ) : (
              <ul className="list-none p-0 m-0">
                {discussions.map((d) => (
                  <li
                    key={d.id}
                    onClick={() => setOpenDiscussion(d)}
                    className="flex items-center justify-between gap-4 px-5.5 py-4 border-b border-lias-border-light
                      last:border-b-0 cursor-pointer transition-colors duration-150 hover:bg-lias-surface-muted/60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-medium text-lias-ink">{d.title}</span>
                        {d.teamName && (
                          <Badge tone="mandate" size="sm">
                            {d.teamName}
                          </Badge>
                        )}
                        {d.eventTitle && (
                          <Badge tone="info" size="sm">
                            {d.eventTitle}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[12px] text-lias-muted mt-1">
                        Ouverte par {d.createdByName} — {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={MessageSquare}>
                      Ouvrir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      <DiscussionThreadModal
        discussion={openDiscussion}
        onClose={() => setOpenDiscussion(null)}
        toast={toast}
      />
    </div>
  );
}
