import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import RequestDetailsModal from '../components/RequestDetailsModal';
import { ToastStack, useToasts } from '../components/Toast';
import {
  getAllRequests,
  approveRequest,
  rejectRequest,
} from '../services/membershipRequestService';

const TABS = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'APPROVED', label: 'Approuvées' },
  { key: 'REJECTED', label: 'Refusées' },
];

function friendlyErrorMessage(err, fallback) {
  if (err.response?.status === 403) {
    return 'Action réservée au Directeur du laboratoire — vous ne disposez pas des droits nécessaires.';
  }
  return err.response?.data?.message || fallback;
}

function TableSkeleton() {
  return (
    <div className="px-5.5 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-lias-border-light last:border-b-0">
          <div className="w-9 h-9 rounded-full bg-lias-bg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 bg-lias-bg rounded animate-pulse" />
            <div className="h-2.5 w-56 bg-lias-bg rounded animate-pulse" />
          </div>
          <div className="h-3 w-28 bg-lias-bg rounded animate-pulse" />
          <div className="h-3 w-20 bg-lias-bg rounded animate-pulse" />
          <div className="h-6 w-20 bg-lias-bg rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function DemandesPage() {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const toast = useToasts();

  const loadRequests = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getAllRequests()
      .then(setAllRequests)
      .catch((err) => setLoadError(friendlyErrorMessage(err, 'Échec du chargement des demandes')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const counts = useMemo(
    () => ({
      total: allRequests.length,
      pending: allRequests.filter((r) => r.status === 'PENDING').length,
      approved: allRequests.filter((r) => r.status === 'APPROVED').length,
      rejected: allRequests.filter((r) => r.status === 'REJECTED').length,
    }),
    [allRequests]
  );

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRequests
      .filter((r) => activeTab === 'ALL' || r.status === activeTab)
      .filter((r) => {
        if (!q) return true;
        const haystack = `${r.firstName} ${r.lastName} ${r.email} ${r.homeInstitution ?? ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [allRequests, activeTab, search]);

  function patchRequest(updated) {
    setAllRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function handleApprove(id) {
    setActionLoadingId(id);
    try {
      const updated = await approveRequest(id);
      patchRequest(updated);
      toast.success(`Demande de ${updated.firstName} ${updated.lastName} acceptée. Compte créé.`);
      setSelectedRequest(null);
    } catch (err) {
      toast.error(friendlyErrorMessage(err, "Échec de l'acceptation de la demande"));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(id) {
    setActionLoadingId(id);
    try {
      const updated = await rejectRequest(id);
      patchRequest(updated);
      toast.success(`Demande de ${updated.firstName} ${updated.lastName} refusée.`);
      setSelectedRequest(null);
    } catch (err) {
      toast.error(friendlyErrorMessage(err, 'Échec du refus de la demande'));
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <div className="mb-6">
        <h1 className="m-0 text-[22px] font-bold text-lias-navy">
          Gestion des Demandes d'Adhésion
        </h1>
        <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
          Consultez, validez ou refusez les demandes d'inscription au laboratoire LIAS.
        </p>
      </div>

      {loadError && (
        <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 mb-7">
        <StatCard label="Total des demandes" value={counts.total} icon={Users} loading={loading} />
        <StatCard
          label="En attente"
          value={counts.pending}
          icon={Clock}
          trend={!loading && counts.pending > 0 ? `${counts.pending} à traiter` : undefined}
          trendPositive={false}
          loading={loading}
        />
        <StatCard label="Approuvées" value={counts.approved} icon={CheckCircle2} loading={loading} />
        <StatCard label="Refusées" value={counts.rejected} icon={XCircle} loading={loading} />
      </div>

      <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5.5 py-4 border-b border-lias-border-light">
          <div className="flex items-center gap-1.5 bg-lias-bg rounded-lg p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium cursor-pointer border-none transition-colors ${
                  activeTab === t.key
                    ? 'bg-white text-lias-navy shadow-sm'
                    : 'bg-transparent text-lias-muted hover:text-lias-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 bg-lias-bg border border-lias-border rounded-lg px-3 py-2 w-full sm:w-72">
            <Search size={15} className="text-lias-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, établissement..."
              className="border-none outline-none bg-transparent text-[13px] w-full text-lias-ink"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filteredRequests.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-lias-muted text-sm">
            Aucune demande ne correspond à ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-lias-bg">
                  {['Candidat', "Établissement d'origine", 'Date de soumission', 'Statut', ''].map(
                    (h, i) => (
                      <th
                        key={h + i}
                        className={`text-[11.5px] font-semibold text-lias-muted uppercase tracking-wider py-3 ${
                          i === 0 ? 'px-5.5 text-left' : i === 4 ? 'px-5.5 text-right' : 'px-3 text-left'
                        }`}
                      >
                        {i === 4 ? 'Actions' : h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => {
                  const isPending = r.status === 'PENDING';
                  const isActing = actionLoadingId === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRequest(r)}
                      className="border-t border-lias-border-light cursor-pointer hover:bg-lias-bg/60"
                    >
                      <td className="px-5.5 py-3.5">
                        <div className="text-[13px] font-medium text-lias-ink">
                          {r.firstName} {r.lastName}
                        </div>
                        <div className="text-[12px] text-lias-muted">{r.email}</div>
                      </td>
                      <td className="px-3 py-3.5 text-[13px] text-lias-muted">
                        {r.homeInstitution || '—'}
                      </td>
                      <td className="px-3 py-3.5 text-[13px] text-lias-muted font-mono">
                        {new Date(r.submittedAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5.5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={isActing}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-[7px] px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              {isActing && <Loader2 size={12} className="animate-spin" />}
                              Accepter
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={isActing}
                              className="bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-[7px] px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Refuser
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-lias-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RequestDetailsModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        actionLoading={actionLoadingId === selectedRequest?.id}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
