import { useCallback, useEffect, useState } from 'react';
import { Users, Clock, Calendar, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import RequestsTable from '../components/RequestsTable';
import { getDashboardStats } from '../services/dashboardService';
import {
  getRequestsByStatus,
  approveRequest,
  rejectRequest,
} from '../services/membershipRequestService';
import { isManagement, ROLE_LABEL_FR } from '../utils/roles';

export default function DashboardPage({ user }) {
  const canManageRequests = isManagement(user);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

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
      .catch((err) => setStatsError(err.response?.data?.message || 'Échec du chargement des statistiques'))
      .finally(() => setStatsLoading(false));
  }, [canManageRequests]);

  const loadRequests = useCallback(() => {
    if (!canManageRequests) return;
    setRequestsLoading(true);
    setRequestsError(null);
    getRequestsByStatus('PENDING', { page: 0, size: 6, sort: 'submittedAt,desc' })
      .then((res) => setRequests(res.content))
      .catch((err) => setRequestsError(err.response?.data?.message || 'Échec du chargement des demandes'))
      .finally(() => setRequestsLoading(false));
  }, [canManageRequests]);

  useEffect(() => {
    loadStats();
    loadRequests();
  }, [loadStats, loadRequests]);

  async function handleApprove(id) {
    setActionError(null);
    setActionLoadingId(id);
    try {
      await approveRequest(id);
      await Promise.all([loadRequests(), loadStats()]);
    } catch (err) {
      setActionError(err.response?.data?.message || "Échec de l'acceptation de la demande");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(id) {
    setActionError(null);
    setActionLoadingId(id);
    try {
      await rejectRequest(id);
      await Promise.all([loadRequests(), loadStats()]);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Échec du refus de la demande');
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="m-0 text-[22px] font-bold text-lias-navy">Tableau de bord</h1>
        <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
          Vue d'ensemble de l'activité du laboratoire LIAS
        </p>
      </div>

      {statsError && (
        <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {statsError}
        </div>
      )}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${canManageRequests ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-4.5 mb-7`}
      >
        <StatCard
          label="Total Membres Permanents"
          value={stats?.permanentMembers ?? 0}
          icon={Users}
          loading={statsLoading}
        />
        {canManageRequests && (
          <StatCard
            label="Demandes en attente"
            value={stats?.pendingRequests ?? 0}
            icon={Clock}
            trend={stats && `${stats.pendingRequests} à traiter`}
            trendPositive={false}
            loading={statsLoading}
          />
        )}
        <StatCard
          label="Événements de l'année"
          value={stats?.eventsThisYear ?? 0}
          icon={Calendar}
          loading={statsLoading}
        />
        <StatCard
          label="Total Publications"
          value={stats?.totalPublications ?? 0}
          icon={BookOpen}
          loading={statsLoading}
        />
      </div>

      {canManageRequests ? (
        <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
          <div className="px-5.5 py-4.5 border-b border-lias-border-light flex items-center justify-between">
            <h2 className="m-0 text-[15.5px] font-semibold text-lias-navy">
              Dernières demandes d'adhésion
            </h2>
            <Link to="/admin/membership-requests" className="text-[12.5px] text-lias-blue-dark font-medium no-underline">
              Voir tout
            </Link>
          </div>

          {actionError && (
            <div className="flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm px-5.5 py-2.5">
              <AlertCircle size={15} />
              {actionError}
            </div>
          )}

          {requestsError ? (
            <div className="flex items-center gap-2 justify-center py-16 text-lias-danger-text text-sm">
              <AlertCircle size={16} />
              {requestsError}
            </div>
          ) : (
            <RequestsTable
              requests={requests}
              loading={requestsLoading}
              actionLoadingId={actionLoadingId}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </div>
      ) : (
        <div className="bg-white border border-lias-border rounded-xl p-8 flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-lias-blue-tint flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-lias-blue-dark" />
          </div>
          <div>
            <h2 className="m-0 text-[15.5px] font-semibold text-lias-navy mb-1.5">
              Bienvenue, {user?.email}
            </h2>
            <p className="text-[13.5px] text-lias-muted m-0">
              Vous êtes connecté(e) en tant que{' '}
              <strong>{ROLE_LABEL_FR[user?.role] ?? user?.role}</strong>. Utilisez le menu à
              gauche pour consulter les membres, publications, événements et réunions du
              laboratoire.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
