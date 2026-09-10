import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Clock, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import RequestDetailsModal from '../components/RequestDetailsModal';
import RequestsTable from '../components/RequestsTable';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  Toolbar,
  SearchInput,
  StatTile,
  Tabs,
  Alert,
} from '../components/ui';
import { getAllRequests, approveRequest, rejectRequest } from '../services/membershipRequestService';
import { MEMBERSHIP_DECISION_ROLES, hasRole } from '../utils/roles';

const TABS = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'APPROVED', label: 'Acceptées' },
  { key: 'REJECTED', label: 'Refusées' },
];

function friendlyErrorMessage(err, fallback) {
  if (err.response?.status === 403) {
    return "Action réservée au directeur en mandat — vous ne disposez pas des droits nécessaires.";
  }
  return err.response?.data?.message || fallback;
}

/**
 * CdC §2.6 — gestion des demandes d'adhésion.
 * La décision (acceptation créant le compte, ou refus) est réservée au
 * directeur en mandat ; la consultation est ouverte à la direction.
 */
export default function DemandesPage({ user }) {
  const canDecide = hasRole(user, MEMBERSHIP_DECISION_ROLES);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [activeTab, setActiveTab] = useState('PENDING');
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
        return `${r.firstName} ${r.lastName} ${r.email} ${r.homeInstitution ?? ''}`
          .toLowerCase()
          .includes(q);
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
      toast.success(
        `Demande de ${updated.firstName} ${updated.lastName} acceptée — compte créé et identifiants envoyés par email.`
      );
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
      toast.success(`Demande de ${updated.firstName} ${updated.lastName} refusée — le candidat en a été informé.`);
      setSelectedRequest(null);
    } catch (err) {
      toast.error(friendlyErrorMessage(err, 'Échec du refus de la demande'));
    } finally {
      setActionLoadingId(null);
    }
  }

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count: t.key === 'PENDING' ? counts.pending : 0,
  }));

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Recrutement scientifique"
        title="Demandes d'adhésion"
        description="Candidatures déposées depuis le portail public. Accepter une demande crée automatiquement le compte du membre, ouvre sa première période d'affiliation et lui transmet ses identifiants."
      />

      {loadError && (
        <Alert tone="danger" className="mb-5">
          {loadError}
        </Alert>
      )}

      <Alert tone="info" className="mb-6" icon={ShieldAlert}>
        Conformément au cahier des charges, seule la <strong>direction en mandat</strong> peut statuer
        sur une demande d'adhésion.
        {!canDecide && ' Vous pouvez consulter les dossiers ; la décision revient au directeur.'}
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatTile label="Demandes reçues" value={counts.total} icon={Users} loading={loading} />
        <StatTile
          label="En attente de décision"
          value={counts.pending}
          hint={counts.pending > 0 ? 'À traiter par la direction' : 'Aucune demande en attente'}
          hintTone={counts.pending > 0 ? 'warning' : 'success'}
          icon={Clock}
          loading={loading}
        />
        <StatTile label="Acceptées" value={counts.approved} icon={CheckCircle2} loading={loading} />
        <StatTile label="Refusées" value={counts.rejected} icon={XCircle} loading={loading} />
      </div>

      <Card>
        <Toolbar>
          <Tabs tabs={tabsWithCounts} active={activeTab} onChange={setActiveTab} />
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un candidat, un établissement..."
            className="w-full sm:w-80 sm:ml-auto"
          />
        </Toolbar>

        <RequestsTable
          requests={filteredRequests}
          loading={loading}
          actionLoadingId={actionLoadingId}
          canDecide={canDecide}
          onApprove={handleApprove}
          onReject={handleReject}
          onRowClick={setSelectedRequest}
        />
      </Card>

      <RequestDetailsModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        canDecide={canDecide}
        actionLoading={actionLoadingId === selectedRequest?.id}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
