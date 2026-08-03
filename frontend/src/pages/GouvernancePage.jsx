import { useCallback, useEffect, useState } from 'react';
import { Users2, Plus, AlertCircle, Pencil, Archive, ShieldCheck, Loader2, ArrowRightLeft } from 'lucide-react';
import StatCard from '../components/StatCard';
import TeamFormModal from '../components/TeamFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TextField, SelectField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import {
  listTeams,
  archiveTeam,
  listActiveMandates,
  assignMandate,
  endMandate,
  transferMemberTeam,
} from '../services/governanceService';
import { searchMembers } from '../services/memberService';

const ROLE_LABEL_FR = {
  DIRECTOR: 'Directeur',
  VICE_DIRECTOR: 'Vice-directeur',
  TEAM_LEADER: "Chef d'équipe",
};

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function GouvernancePage() {
  const [tab, setTab] = useState('teams');
  const toast = useToasts();

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const [mandates, setMandates] = useState([]);
  const [mandatesLoading, setMandatesLoading] = useState(true);
  const [mandatesError, setMandatesError] = useState(null);
  const [members, setMembers] = useState([]);
  const [endingId, setEndingId] = useState(null);

  const [assignForm, setAssignForm] = useState({ memberId: '', role: 'TEAM_LEADER', teamId: '', startDate: '' });
  const [assigning, setAssigning] = useState(false);

  const [transferForm, setTransferForm] = useState({ memberId: '', newTeamId: '', effectiveDate: '' });
  const [transferring, setTransferring] = useState(false);

  const loadTeams = useCallback(() => {
    setTeamsLoading(true);
    setTeamsError(null);
    listTeams()
      .then(setTeams)
      .catch((err) => setTeamsError(friendlyError(err, 'Échec du chargement des équipes')))
      .finally(() => setTeamsLoading(false));
  }, []);

  const loadMandates = useCallback(() => {
    setMandatesLoading(true);
    setMandatesError(null);
    listActiveMandates()
      .then(setMandates)
      .catch((err) => setMandatesError(friendlyError(err, 'Échec du chargement des mandats')))
      .finally(() => setMandatesLoading(false));
  }, []);

  useEffect(() => {
    loadTeams();
    loadMandates();
    searchMembers({ page: 0, size: 200, sort: 'lastName,asc' })
      .then((res) => setMembers(res.content))
      .catch(() => {});
  }, [loadTeams, loadMandates]);

  function openCreateTeam() {
    setEditingTeam(null);
    setFormOpen(true);
  }

  function openEditTeam(team) {
    setEditingTeam(team);
    setFormOpen(true);
  }

  async function handleArchiveTeam() {
    setArchiving(true);
    try {
      await archiveTeam(archiveTarget.id);
      toast.success('Équipe archivée.');
      setArchiveTarget(null);
      loadTeams();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'archivage de l'équipe"));
    } finally {
      setArchiving(false);
    }
  }

  async function handleAssignMandate(e) {
    e.preventDefault();
    if (!assignForm.memberId || !assignForm.startDate) return;
    setAssigning(true);
    try {
      await assignMandate({
        memberId: assignForm.memberId,
        role: assignForm.role,
        teamId: assignForm.role === 'TEAM_LEADER' ? assignForm.teamId || undefined : undefined,
        startDate: assignForm.startDate,
      });
      toast.success('Mandat attribué.');
      setAssignForm({ memberId: '', role: 'TEAM_LEADER', teamId: '', startDate: '' });
      loadMandates();
      loadTeams();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'attribution du mandat"));
    } finally {
      setAssigning(false);
    }
  }

  async function handleEndMandate(mandate) {
    setEndingId(mandate.id);
    try {
      await endMandate(mandate.id, { endDate: new Date().toISOString().slice(0, 10) });
      toast.success('Mandat terminé.');
      loadMandates();
      loadTeams();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la clôture du mandat'));
    } finally {
      setEndingId(null);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!transferForm.memberId || !transferForm.newTeamId || !transferForm.effectiveDate) return;
    setTransferring(true);
    try {
      await transferMemberTeam(transferForm);
      toast.success('Membre transféré vers la nouvelle équipe.');
      setTransferForm({ memberId: '', newTeamId: '', effectiveDate: '' });
      loadTeams();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du transfert'));
    } finally {
      setTransferring(false);
    }
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <div className="mb-6">
        <h1 className="m-0 text-[22px] font-bold text-lias-navy">Gouvernance</h1>
        <p className="mt-1.5 mb-0 text-[13.5px] text-lias-muted">
          Équipes de recherche, mandats et responsabilités du laboratoire.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 mb-7">
        <StatCard label="Équipes" value={teams.length} icon={Users2} loading={teamsLoading} />
        <StatCard label="Mandats actifs" value={mandates.length} icon={ShieldCheck} loading={mandatesLoading} />
      </div>

      <div className="flex items-center gap-1.5 bg-lias-bg rounded-lg p-1 w-fit mb-5">
        {[
          { key: 'teams', label: 'Équipes' },
          { key: 'mandates', label: 'Mandats' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium cursor-pointer border-none transition-colors ${
              tab === t.key ? 'bg-white text-lias-navy shadow-sm' : 'bg-transparent text-lias-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'teams' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={openCreateTeam}
              className="bg-lias-blue text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2"
            >
              <Plus size={16} />
              Nouvelle équipe
            </button>
          </div>

          {teamsError && (
            <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
              <AlertCircle size={16} />
              {teamsError}
            </div>
          )}

          <div className="bg-white border border-lias-border rounded-xl overflow-hidden mb-7">
            {teamsLoading ? (
              <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Chargement...</div>
            ) : teams.length === 0 ? (
              <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Aucune équipe.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-lias-bg">
                      {['Équipe', 'Responsable', 'Membres', ''].map((h, i) => (
                        <th
                          key={h + i}
                          className={`text-[11.5px] font-semibold text-lias-muted uppercase tracking-wider py-3 ${
                            i === 3 ? 'px-5.5 text-right' : 'px-5.5 text-left'
                          }`}
                        >
                          {i === 3 ? 'Actions' : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t) => (
                      <tr key={t.id} className="border-t border-lias-border-light">
                        <td className="px-5.5 py-3.5">
                          <div className="text-[13px] font-medium text-lias-ink">{t.name}</div>
                          {t.description && <div className="text-[12px] text-lias-muted">{t.description}</div>}
                        </td>
                        <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{t.currentLeaderName || '—'}</td>
                        <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{t.memberCount}</td>
                        <td className="px-5.5 py-3.5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEditTeam(t)}
                              className="w-8 h-8 rounded-lg border border-lias-border bg-white cursor-pointer flex items-center justify-center text-lias-muted hover:text-lias-blue-dark"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setArchiveTarget(t)}
                              className="w-8 h-8 rounded-lg border border-rose-200 bg-white cursor-pointer flex items-center justify-center text-rose-600 hover:bg-rose-50"
                            >
                              <Archive size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-lias-border rounded-xl p-5.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-lias-navy mb-4">
              <ArrowRightLeft size={16} />
              Transférer un membre vers une autre équipe
            </div>
            <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 items-end">
              <SelectField
                label="Membre"
                value={transferForm.memberId}
                onChange={(e) => setTransferForm({ ...transferForm, memberId: e.target.value })}
              >
                <option value="">—</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Nouvelle équipe"
                value={transferForm.newTeamId}
                onChange={(e) => setTransferForm({ ...transferForm, newTeamId: e.target.value })}
              >
                <option value="">—</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Date d'effet"
                type="date"
                value={transferForm.effectiveDate}
                onChange={(e) => setTransferForm({ ...transferForm, effectiveDate: e.target.value })}
              />
              <button
                type="submit"
                disabled={transferring}
                className="bg-white border border-lias-border text-lias-ink rounded-lg py-2.5 px-4 text-sm font-medium cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mb-3.5"
              >
                {transferring && <Loader2 size={14} className="animate-spin" />}
                Transférer
              </button>
            </form>
          </div>
        </>
      )}

      {tab === 'mandates' && (
        <>
          <div className="bg-white border border-lias-border rounded-xl p-5.5 mb-7">
            <div className="text-sm font-semibold text-lias-navy mb-4">Attribuer un mandat</div>
            <form onSubmit={handleAssignMandate} className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 items-end">
              <SelectField
                label="Membre"
                value={assignForm.memberId}
                onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
              >
                <option value="">—</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Rôle"
                value={assignForm.role}
                onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
              >
                <option value="DIRECTOR">Directeur</option>
                <option value="VICE_DIRECTOR">Vice-directeur</option>
                <option value="TEAM_LEADER">Chef d'équipe</option>
              </SelectField>
              {assignForm.role === 'TEAM_LEADER' && (
                <SelectField
                  label="Équipe"
                  value={assignForm.teamId}
                  onChange={(e) => setAssignForm({ ...assignForm, teamId: e.target.value })}
                >
                  <option value="">—</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </SelectField>
              )}
              <TextField
                label="Date de début"
                type="date"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
              />
              <button
                type="submit"
                disabled={assigning}
                className="bg-lias-blue text-white border-none rounded-lg py-2.5 px-4 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mb-3.5"
              >
                {assigning && <Loader2 size={14} className="animate-spin" />}
                Attribuer
              </button>
            </form>
          </div>

          {mandatesError && (
            <div className="mb-5 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-4 py-3">
              <AlertCircle size={16} />
              {mandatesError}
            </div>
          )}

          <div className="bg-white border border-lias-border rounded-xl overflow-hidden">
            {mandatesLoading ? (
              <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Chargement...</div>
            ) : mandates.length === 0 ? (
              <div className="px-5.5 py-8 text-center text-sm text-lias-muted">Aucun mandat actif.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-lias-bg">
                      {['Membre', 'Rôle', 'Équipe', 'Depuis', ''].map((h, i) => (
                        <th
                          key={h + i}
                          className={`text-[11.5px] font-semibold text-lias-muted uppercase tracking-wider py-3 ${
                            i === 4 ? 'px-5.5 text-right' : 'px-5.5 text-left'
                          }`}
                        >
                          {i === 4 ? 'Actions' : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mandates.map((m) => (
                      <tr key={m.id} className="border-t border-lias-border-light">
                        <td className="px-5.5 py-3.5 text-[13px] font-medium text-lias-ink">{m.memberName}</td>
                        <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">
                          {ROLE_LABEL_FR[m.role] || m.role}
                        </td>
                        <td className="px-5.5 py-3.5 text-[13px] text-lias-muted">{m.teamName || '—'}</td>
                        <td className="px-5.5 py-3.5 text-[13px] text-lias-muted font-mono">{m.startDate}</td>
                        <td className="px-5.5 py-3.5 text-right">
                          <button
                            onClick={() => handleEndMandate(m)}
                            disabled={endingId === m.id}
                            className="bg-white border border-lias-border text-lias-ink rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                          >
                            {endingId === m.id && <Loader2 size={12} className="animate-spin" />}
                            Terminer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <TeamFormModal
        open={formOpen}
        team={editingTeam}
        onClose={() => setFormOpen(false)}
        onSaved={loadTeams}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archiver cette équipe"
        message={`Voulez-vous vraiment archiver l'équipe "${archiveTarget?.name}" ?`}
        confirmLabel="Archiver"
        loading={archiving}
        onConfirm={handleArchiveTeam}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
