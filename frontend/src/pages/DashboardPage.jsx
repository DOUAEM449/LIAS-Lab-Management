import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  Calendar,
  BookOpen,
  Users2,
  ArrowRight,
  UserPlus,
  Plus,
  FolderArchive,
  CalendarDays,
  Crown,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import RequestsTable from '../components/RequestsTable';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  CardHeader,
  StatTile,
  Button,
  Badge,
  MandateBadge,
  Alert,
  EmptyState,
  Skeleton,
  BarChart,
  DistributionBar,
} from '../components/ui';
import {
  getDashboardStats,
  getPublicationsByYear,
  getMemberStatusBreakdown,
  getCurrentGovernance,
  getUpcomingEvents,
} from '../services/dashboardService';
import { getRequestsByStatus, approveRequest, rejectRequest } from '../services/membershipRequestService';
import { isManagement, hasRole, ROLE_LABEL_FR, INTERNAL_MODULE_ROLES, MEMBERSHIP_DECISION_ROLES } from '../utils/roles';
import { MEMBER_STATUS_LABEL } from '../components/ui/Badge';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

const STATUS_COLOR = {
  PERMANENT: 'bg-lias-blue',
  ASSOCIATE: 'bg-lias-mandate',
  PHD_STUDENT: 'bg-lias-success',
  RETIRED: 'bg-lias-warning',
  FORMER: 'bg-lias-border-strong',
};

export default function DashboardPage({ user }) {
  const canManageRequests = isManagement(user);
  const canDecideRequests = hasRole(user, MEMBERSHIP_DECISION_ROLES);
  const canSeeInternalModules = hasRole(user, INTERNAL_MODULE_ROLES);
  const toast = useToasts();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [pubSeries, setPubSeries] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [governance, setGovernance] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [panelsLoading, setPanelsLoading] = useState(true);

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    setStatsError(null);
    getDashboardStats(canManageRequests)
      .then(setStats)
      .catch((err) => setStatsError(friendlyError(err, 'Échec du chargement des statistiques')))
      .finally(() => setStatsLoading(false));
  }, [canManageRequests]);

  const loadPanels = useCallback(() => {
    setPanelsLoading(true);
    Promise.all([
      getPublicationsByYear(5),
      getMemberStatusBreakdown(),
      getCurrentGovernance(),
      getUpcomingEvents(4),
    ])
      .then(([series, breakdown, gov, events]) => {
        setPubSeries(series);
        setStatusBreakdown(breakdown);
        setGovernance(gov);
        setUpcoming(events);
      })
      .catch(() => {
        /* Panels are complementary — a failure here must not blank the dashboard. */
      })
      .finally(() => setPanelsLoading(false));
  }, []);

  const loadRequests = useCallback(() => {
    if (!canManageRequests) return;
    setRequestsLoading(true);
    setRequestsError(null);
    getRequestsByStatus('PENDING', { page: 0, size: 5, sort: 'submittedAt,desc' })
      .then((res) => setRequests(res.content))
      .catch((err) => setRequestsError(friendlyError(err, 'Échec du chargement des demandes')))
      .finally(() => setRequestsLoading(false));
  }, [canManageRequests]);

  useEffect(() => {
    loadStats();
    loadPanels();
    loadRequests();
  }, [loadStats, loadPanels, loadRequests]);

  async function handleDecision(id, decide, successMessage, failureMessage) {
    setActionError(null);
    setActionLoadingId(id);
    try {
      await decide(id);
      toast.success(successMessage);
      await Promise.all([loadRequests(), loadStats()]);
    } catch (err) {
      setActionError(friendlyError(err, failureMessage));
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow={`Bonjour — ${ROLE_LABEL_FR[user?.role] ?? user?.role ?? ''}`}
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité scientifique et administrative du laboratoire LIAS."
        actions={
          <>
            <Link to="/admin/calendar" className="no-underline hidden sm:block">
              <Button variant="secondary" icon={CalendarDays}>
                Calendrier
              </Button>
            </Link>
            {canManageRequests && (
              <Link to="/admin/membership-requests" className="no-underline">
                <Button icon={UserPlus}>Demandes d'adhésion</Button>
              </Link>
            )}
          </>
        }
      />

      {statsError && (
        <Alert tone="danger" className="mb-5">
          {statsError}
        </Alert>
      )}

      {/* --- KPI row ------------------------------------------------------ */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${canManageRequests ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-4 mb-6`}
      >
        <StatTile
          label="Membres permanents"
          value={stats?.permanentMembers ?? 0}
          hint="Statut PERMANENT"
          icon={Users}
          loading={statsLoading}
        />
        {canManageRequests && (
          <StatTile
            label="Demandes en attente"
            value={stats?.pendingRequests ?? 0}
            hint={stats?.pendingRequests > 0 ? 'À valider par la direction' : 'Aucune demande à traiter'}
            hintTone={stats?.pendingRequests > 0 ? 'warning' : 'success'}
            icon={Clock}
            loading={statsLoading}
          />
        )}
        <StatTile
          label="Événements cette année"
          value={stats?.eventsThisYear ?? 0}
          hint="Conférences, séminaires, workshops"
          icon={Calendar}
          loading={statsLoading}
        />
        <StatTile
          label="Publications"
          value={stats?.totalPublications ?? 0}
          hint="Toutes années confondues"
          icon={BookOpen}
          loading={statsLoading}
        />
        <StatTile
          label="Équipes de recherche"
          value={stats?.teamCount ?? 0}
          hint="Pilotées par un chef d'équipe"
          icon={Users2}
          loading={statsLoading}
        />
      </div>

      {/* --- Charts ------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card>
          <CardHeader
            icon={BookOpen}
            title="Production scientifique"
            description="Publications enregistrées par année"
          />
          <div className="px-5.5 py-5">
            {panelsLoading ? (
              <Skeleton className="h-[150px] rounded-lg" />
            ) : (
              <BarChart
                data={pubSeries.map((p) => ({ label: String(p.year), value: p.count }))}
                emptyLabel="Aucune publication enregistrée sur les cinq dernières années"
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={Users}
            title="Composition du laboratoire"
            description="Répartition des membres par statut (CdC §2.2)"
          />
          <div className="px-5.5 py-5">
            {panelsLoading ? (
              <Skeleton className="h-[150px] rounded-lg" />
            ) : (
              <DistributionBar
                data={statusBreakdown.map((s) => ({
                  label: MEMBER_STATUS_LABEL[s.status] ?? s.status,
                  value: s.count,
                  className: STATUS_COLOR[s.status] ?? 'bg-lias-border-strong',
                }))}
                emptyLabel="Aucun membre enregistré"
              />
            )}
          </div>
        </Card>
      </div>

      {/* --- Governance + upcoming ---------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card>
          <CardHeader
            icon={ShieldCheck}
            title="Gouvernance en exercice"
            description="Déterminée par les mandats actifs, jamais par un rôle stocké"
            actions={
              isManagement(user) && (
                <Link to="/admin/governance" className="no-underline">
                  <Button variant="ghost" size="sm" icon={ArrowRight} iconRight>
                    Gérer
                  </Button>
                </Link>
              )
            }
          />
          <div className="px-5.5 py-5">
            {panelsLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            ) : !governance?.director && !governance?.viceDirector ? (
              <EmptyState
                icon={Crown}
                title="Aucun mandat actif"
                description="Aucun directeur ni vice-directeur n'est actuellement en mandat."
                className="py-6"
              />
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col gap-3">
                {[governance.director, governance.viceDirector].filter(Boolean).map((mandate) => (
                  <li
                    key={mandate.id}
                    className="flex items-center justify-between gap-3 bg-lias-surface-muted/60 border border-lias-border-light rounded-lg px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-lias-ink truncate">
                        {mandate.memberName}
                      </div>
                      <div className="text-[11.5px] text-lias-muted font-mono mt-0.5">
                        Depuis le {new Date(mandate.startDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <MandateBadge role={mandate.role} />
                  </li>
                ))}
                {governance.teamLeaders.length > 0 && (
                  <li className="text-[12.5px] text-lias-muted pt-1">
                    {governance.teamLeaders.length} chef(s) d'équipe également en mandat.
                  </li>
                )}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={Calendar}
            title="Prochains événements"
            description="Conférences, séminaires et workshops à venir"
            actions={
              <Link to="/admin/events" className="no-underline">
                <Button variant="ghost" size="sm" icon={ArrowRight} iconRight>
                  Tout voir
                </Button>
              </Link>
            }
          />
          {panelsLoading ? (
            <div className="px-5.5 py-5 flex flex-col gap-3">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Aucun événement à venir"
              description="Aucun événement scientifique n'est programmé pour le moment."
              className="py-10"
            />
          ) : (
            <ul className="list-none p-0 m-0">
              {upcoming.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3.5 px-5.5 py-3.5 border-t border-lias-border-light"
                >
                  <div className="w-11 shrink-0 text-center">
                    <div className="text-[16px] font-bold text-lias-navy leading-none">
                      {new Date(e.startDate).getDate()}
                    </div>
                    <div className="text-[10.5px] uppercase text-lias-muted font-semibold mt-1">
                      {new Date(e.startDate).toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-lias-ink truncate">{e.title}</div>
                    <div className="flex items-center gap-3 text-[11.5px] text-lias-muted mt-0.5">
                      <Badge tone="info" size="sm">
                        {e.type}
                      </Badge>
                      {e.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={11} />
                          {e.location}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* --- Pending membership requests (governance only) ----------------- */}
      {canManageRequests ? (
        <Card>
          <CardHeader
            icon={UserPlus}
            title="Demandes d'adhésion en attente"
            description="Seul le directeur en mandat peut accepter ou refuser une demande (CdC §2.6)."
            actions={
              <Link to="/admin/membership-requests" className="no-underline">
                <Button variant="ghost" size="sm" icon={ArrowRight} iconRight>
                  Voir tout
                </Button>
              </Link>
            }
          />

          {actionError && (
            <Alert tone="danger" className="mx-5.5 mt-4">
              {actionError}
            </Alert>
          )}

          {requestsError ? (
            <Alert tone="danger" className="m-5.5">
              {requestsError}
            </Alert>
          ) : (
            <RequestsTable
              requests={requests}
              loading={requestsLoading}
              actionLoadingId={actionLoadingId}
              canDecide={canDecideRequests}
              onApprove={(id) =>
                handleDecision(id, approveRequest, 'Demande acceptée : le compte a été créé.', "Échec de l'acceptation")
              }
              onReject={(id) =>
                handleDecision(id, rejectRequest, 'Demande refusée.', 'Échec du refus de la demande')
              }
            />
          )}
        </Card>
      ) : (
        <Card padded>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-lias-blue-tint-solid flex items-center justify-center shrink-0">
              <Users size={20} className="text-lias-blue-dark" />
            </div>
            <div className="min-w-0">
              <h2 className="m-0 text-[15px] font-semibold text-lias-navy mb-1.5">
                Bienvenue, {user?.email}
              </h2>
              <p className="text-[13.5px] text-lias-muted m-0 leading-relaxed">
                Vous êtes connecté(e) en tant que{' '}
                <strong className="text-lias-ink">{ROLE_LABEL_FR[user?.role] ?? user?.role}</strong>. Utilisez le
                menu latéral pour consulter les membres, les publications, les événements
                {canSeeInternalModules ? ', les réunions et le matériel' : ''} du laboratoire.
              </p>
              <div className="flex flex-wrap gap-2.5 mt-4">
                <Link to="/admin/publications" className="no-underline">
                  <Button variant="secondary" size="sm" icon={Plus}>
                    Ajouter une publication
                  </Button>
                </Link>
                <Link to="/admin/calendar" className="no-underline">
                  <Button variant="secondary" size="sm" icon={CalendarDays}>
                    Voir le calendrier
                  </Button>
                </Link>
                {canSeeInternalModules && (
                  <Link to="/admin/documents" className="no-underline">
                    <Button variant="secondary" size="sm" icon={FolderArchive}>
                      Archive documentaire
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
