import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  FileCheck,
  FileX,
  ClipboardCheck,
  MapPin,
} from 'lucide-react';
import MeetingFormModal from '../components/MeetingFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  Toolbar,
  SearchInput,
  StatTile,
  Tabs,
  Button,
  IconButton,
  Badge,
  Alert,
  EmptyState,
  TableSkeleton,
  Table,
  THead,
  TBody,
  TR,
  TD,
  TDPrimary,
  TDActions,
} from '../components/ui';
import { listMeetings, deleteMeeting } from '../services/meetingService';
import { EVENT_MEETING_CREATE_ROLES, MANAGEMENT_ROLES, hasRole } from '../utils/roles';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function ReunionsPage({ user }) {
  const canManage = hasRole(user, EVENT_MEETING_CREATE_ROLES);
  const canDelete = hasRole(user, MANAGEMENT_ROLES);

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [when, setWhen] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToasts();

  const loadMeetings = useCallback(() => {
    setLoading(true);
    setError(null);
    listMeetings({ size: 100 })
      .then((res) => setMeetings(res.content))
      .catch((err) => setError(friendlyError(err, 'Échec du chargement des réunions')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const now = new Date();
  const upcomingCount = meetings.filter((m) => new Date(m.meetingDate) > now).length;
  const withMinutesCount = meetings.filter((m) => m.hasMinutes).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return meetings.filter((m) => {
      const matchesSearch =
        !q ||
        m.title?.toLowerCase().includes(q) ||
        m.type?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q);
      const date = new Date(m.meetingDate);
      const matchesWhen =
        when === 'all' || (when === 'upcoming' ? date >= now : when === 'past' ? date < now : true);
      return matchesSearch && matchesWhen;
    });
  }, [meetings, search, when]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMeeting(deleteTarget.id);
      toast.success('Réunion archivée.');
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

      <PageHeader
        eyebrow="Instances du laboratoire"
        title="Réunions & procès-verbaux"
        description="Planification des réunions internes, ordre du jour et archivage des procès-verbaux. Chaque PV reste consultable et téléchargeable dans la durée."
        actions={
          canManage && (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Nouvelle réunion
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
        <StatTile label="Réunions enregistrées" value={meetings.length} icon={CalendarClock} loading={loading} />
        <StatTile
          label="À venir"
          value={upcomingCount}
          hint={upcomingCount > 0 ? 'Prochainement' : 'Aucune réunion programmée'}
          icon={CalendarClock}
          loading={loading}
        />
        <StatTile
          label="PV archivés"
          value={withMinutesCount}
          hint={
            meetings.length > 0
              ? `${Math.round((withMinutesCount / meetings.length) * 100)}% des réunions documentées`
              : undefined
          }
          hintTone={withMinutesCount === meetings.length && meetings.length > 0 ? 'success' : 'warning'}
          icon={FileCheck}
          loading={loading}
        />
      </div>

      <Card>
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une réunion..."
            className="w-full sm:w-72"
          />
          <Tabs
            tabs={[
              { key: 'all', label: 'Toutes' },
              { key: 'upcoming', label: 'À venir' },
              { key: 'past', label: 'Passées' },
            ]}
            active={when}
            onChange={setWhen}
          />
          <div className="sm:ml-auto text-[12.5px] text-lias-muted">
            {loading ? '—' : `${visible.length} réunion(s)`}
          </div>
        </Toolbar>

        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Aucune réunion"
            description={
              search || when !== 'all'
                ? 'Aucune réunion ne correspond à ces critères.'
                : "Planifiez la première réunion interne du laboratoire."
            }
            action={
              canManage && !search ? (
                <Button
                  icon={Plus}
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  Planifier une réunion
                </Button>
              ) : null
            }
          />
        ) : (
          <Table minWidth="min-w-[820px]">
            <THead
              columns={[
                'Réunion',
                'Date et heure',
                'Type',
                'Lieu',
                'Procès-verbal',
                { label: 'Actions', align: 'right' },
              ]}
            />
            <TBody>
              {visible.map((m) => {
                const date = new Date(m.meetingDate);
                const isPast = date < now;
                return (
                  <TR key={m.id} onClick={canManage ? () => { setEditing(m); setFormOpen(true); } : undefined}>
                    <TDPrimary
                      title={m.title}
                      subtitle={m.agenda ? m.agenda.slice(0, 80) + (m.agenda.length > 80 ? '…' : '') : null}
                    />
                    <TD className="text-lias-muted font-mono text-[12.5px]">
                      {date.toLocaleDateString('fr-FR')}
                      <span className="block text-[11.5px] text-lias-faint">
                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {isPast ? ' — passée' : ''}
                      </span>
                    </TD>
                    <TD className="text-lias-muted">{m.type || '—'}</TD>
                    <TD className="text-lias-muted">
                      {m.location ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-lias-faint shrink-0" />
                          {m.location}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TD>
                    <TD>
                      {m.hasMinutes ? (
                        <Badge tone="success" icon={FileCheck} size="sm">
                          Archivé
                        </Badge>
                      ) : (
                        <Badge tone={isPast ? 'warning' : 'neutral'} icon={FileX} size="sm">
                          {isPast ? 'À rédiger' : 'En attente'}
                        </Badge>
                      )}
                    </TD>
                    <TDActions>
                      {canManage && (
                        <IconButton
                          icon={Pencil}
                          label="Modifier / gérer les PV"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(m);
                            setFormOpen(true);
                          }}
                        />
                      )}
                      {canDelete && (
                        <IconButton
                          icon={Trash2}
                          label="Archiver"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(m);
                          }}
                        />
                      )}
                    </TDActions>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <MeetingFormModal
        open={formOpen}
        meeting={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadMeetings}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archiver la réunion"
        message={`« ${deleteTarget?.title} » sera archivée (suppression logique). Les procès-verbaux déjà déposés restent conservés.`}
        confirmLabel="Archiver"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
