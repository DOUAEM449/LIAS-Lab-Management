import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, GraduationCap, UserCheck, Users2, Building2 } from 'lucide-react';
import { ToastStack, useToasts } from '../components/Toast';
import MemberDetailsModal from '../components/MemberDetailsModal';
import {
  PageHeader,
  Card,
  Toolbar,
  SearchInput,
  StatTile,
  Tabs,
  Table,
  THead,
  TBody,
  TR,
  TD,
  StatusBadge,
  Alert,
  TableSkeleton,
  EmptyState,
} from '../components/ui';
import { searchMembers } from '../services/memberService';

const STATUS_TABS = [
  { key: 'ALL', label: 'Tous' },
  { key: 'PERMANENT', label: 'Permanents' },
  { key: 'ASSOCIATE', label: 'Associés' },
  { key: 'PHD_STUDENT', label: 'Doctorants' },
  { key: 'RETIRED', label: 'Retraités' },
  { key: 'FORMER', label: 'Anciens' },
];

function avatarHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export default function MembresPage({ currentUser, myMemberId }) {
  const [members, setMembers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const toast = useToasts();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadMembers = useCallback(() => {
    setLoading(true);
    setError(null);
    searchMembers({
      status: activeTab === 'ALL' ? undefined : activeTab,
      search: debouncedSearch || undefined,
      page: 0,
      size: 50,
      sort: 'lastName,asc',
    })
      .then((res) => {
        setMembers(res.content);
        setTotalElements(res.totalElements);
      })
      .catch((err) => setError(err.response?.data?.message || 'Échec du chargement des membres'))
      .finally(() => setLoading(false));
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const counts = useMemo(() => {
    const c = { PERMANENT: 0, ASSOCIATE: 0, PHD_STUDENT: 0, teams: new Set() };
    members.forEach((m) => {
      if (c[m.currentStatus] !== undefined) c[m.currentStatus] += 1;
      if (m.currentTeamName) c.teams.add(m.currentTeamName);
    });
    return { ...c, teamCount: c.teams.size };
  }, [members]);

  function handleUpdated(updated) {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
  }

  function handleArchivedOrRestored() {
    loadMembers();
    setSelectedId(null);
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <PageHeader
        eyebrow="Ressources humaines scientifiques"
        title="Membres du laboratoire"
        description="Profils, statuts d'appartenance et affiliations. Le statut (permanent, associé, doctorant, retraité, ancien) est une catégorie d'appartenance : il est distinct du rôle et du mandat de gouvernance."
      />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Membres correspondants"
          value={totalElements}
          hint={activeTab === 'ALL' ? 'Tous statuts confondus' : 'Sur le filtre actif'}
          icon={Users}
          loading={loading}
        />
        <StatTile label="Permanents" value={counts.PERMANENT} icon={UserCheck} loading={loading} />
        <StatTile label="Doctorants" value={counts.PHD_STUDENT} icon={GraduationCap} loading={loading} />
        <StatTile label="Équipes représentées" value={counts.teamCount} icon={Users2} loading={loading} />
      </div>

      <Card>
        <Toolbar>
          <Tabs tabs={STATUS_TABS} active={activeTab} onChange={setActiveTab} className="flex-wrap" />
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom, email..."
            className="w-full sm:w-72 sm:ml-auto"
          />
        </Toolbar>

        {loading ? (
          <TableSkeleton rows={6} columns={4} />
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun membre"
            description={
              debouncedSearch
                ? `Aucun membre ne correspond à « ${debouncedSearch} ».`
                : "Aucun membre n'a ce statut pour le moment."
            }
          />
        ) : (
          <Table minWidth="min-w-[780px]">
            <THead columns={['Membre', "Établissement d'origine", 'Équipe actuelle', 'Statut']} />
            <TBody>
              {members.map((m) => {
                const fullName = `${m.firstName} ${m.lastName}`;
                return (
                  <TR key={m.id} onClick={() => setSelectedId(m.id)}>
                    <TD>
                      <div className="flex items-center gap-3">
                        {m.photoUrl ? (
                          <img
                            src={m.photoUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-lias-border"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11.5px] font-semibold shrink-0"
                            style={{ background: `oklch(58% 0.1 ${avatarHue(fullName)})` }}
                            aria-hidden="true"
                          >
                            {m.firstName?.[0]}
                            {m.lastName?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-lias-ink truncate">{fullName}</div>
                          <div className="text-[11.5px] text-lias-muted truncate">{m.email}</div>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-lias-muted">
                      {m.homeInstitution ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-lias-faint shrink-0" />
                          {m.homeInstitution}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TD>
                    <TD className="text-lias-muted">{m.currentTeamName || '—'}</TD>
                    <TD>
                      <StatusBadge status={m.currentStatus} />
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <MemberDetailsModal
        memberId={selectedId}
        currentUser={currentUser}
        myMemberId={myMemberId}
        onClose={() => setSelectedId(null)}
        onUpdated={handleUpdated}
        onArchivedOrRestored={handleArchivedOrRestored}
        toast={toast}
      />
    </div>
  );
}
