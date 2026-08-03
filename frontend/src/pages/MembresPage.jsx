import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, GraduationCap, UserCheck, Archive, Search, AlertCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import { ToastStack, useToasts } from '../components/Toast';
import MemberDetailsModal from '../components/MemberDetailsModal';
import { searchMembers } from '../services/memberService';

const STATUS_TABS = [
  { key: 'ALL', label: 'Tous' },
  { key: 'PERMANENT', label: 'Permanents' },
  { key: 'ASSOCIATE', label: 'Associés' },
  { key: 'PHD_STUDENT', label: 'Doctorants' },
  { key: 'RETIRED', label: 'Retraités' },
  { key: 'FORMER', label: 'Anciens' },
];

const STATUS_BADGE = {
  PERMANENT: 'bg-blue-100 text-blue-700',
  ASSOCIATE: 'bg-violet-100 text-violet-700',
  PHD_STUDENT: 'bg-emerald-100 text-emerald-700',
  RETIRED: 'bg-slate-200 text-slate-600',
  FORMER: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL_FR = {
  PERMANENT: 'Permanent',
  ASSOCIATE: 'Associé',
  PHD_STUDENT: 'Doctorant',
  RETIRED: 'Retraité',
  FORMER: 'Ancien membre',
};

function avatarHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function TableSkeleton() {
  return (
    <div className="px-5.5 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-lias-border-light last:border-b-0">
          <div className="w-9 h-9 rounded-full bg-lias-bg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 bg-lias-bg rounded animate-pulse" />
            <div className="h-2.5 w-56 bg-lias-bg rounded animate-pulse" />
          </div>
          <div className="h-6 w-24 bg-lias-bg rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function MembresPage() {
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
    const c = { PERMANENT: 0, ASSOCIATE: 0, PHD_STUDENT: 0 };
    members.forEach((m) => {
      if (c[m.currentStatus] !== undefined) c[m.currentStatus]++;
    });
    return c;
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

      <div className="mb-6">
        <h1 className="m-0 text-[22px] font-bold text-lias-navy">Gestion des Membres</h1>
        <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
          Consultez et gérez les profils, statuts et affiliations des membres du laboratoire.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 mb-7">
        <StatCard label="Total (page actuelle)" value={totalElements} icon={Users} loading={loading} />
        <StatCard label="Permanents" value={counts.PERMANENT} icon={UserCheck} loading={loading} />
        <StatCard label="Doctorants" value={counts.PHD_STUDENT} icon={GraduationCap} loading={loading} />
        <StatCard label="Associés" value={counts.ASSOCIATE} icon={Archive} loading={loading} />
      </div>

      <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5.5 py-4 border-b border-lias-border-light">
          <div className="flex items-center gap-1.5 bg-lias-bg rounded-lg p-1 flex-wrap">
            {STATUS_TABS.map((t) => (
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
              placeholder="Rechercher par nom, email..."
              className="border-none outline-none bg-transparent text-[13px] w-full text-lias-ink"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : members.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-lias-muted text-sm">
            Aucun membre ne correspond à ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-lias-bg">
                  {['Membre', 'Établissement', 'Équipe', 'Statut'].map((h) => (
                    <th
                      key={h}
                      className="text-[11.5px] font-semibold text-lias-muted uppercase tracking-wider py-3 px-5.5 text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const fullName = `${m.firstName} ${m.lastName}`;
                  const hue = avatarHue(fullName);
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className="border-t border-lias-border-light cursor-pointer hover:bg-lias-bg/60"
                    >
                      <td className="px-5.5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                            style={{ background: `oklch(60% 0.1 ${hue})` }}
                          >
                            {m.firstName?.[0]}
                            {m.lastName?.[0]}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-lias-ink">{fullName}</div>
                            <div className="text-[12px] text-lias-muted">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">
                        {m.homeInstitution || '—'}
                      </td>
                      <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">
                        {m.currentTeamName || '—'}
                      </td>
                      <td className="px-5.5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${STATUS_BADGE[m.currentStatus]}`}
                        >
                          {STATUS_LABEL_FR[m.currentStatus] || m.currentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MemberDetailsModal
        memberId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={handleUpdated}
        onArchivedOrRestored={handleArchivedOrRestored}
        toast={toast}
      />
    </div>
  );
}
