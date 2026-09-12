import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users2,
  Plus,
  Pencil,
  Archive,
  ShieldCheck,
  ArrowRightLeft,
  Crown,
  UserCog,
  Network,
  CalendarClock,
  Info,
  Square,
} from 'lucide-react';
import TeamFormModal from '../components/TeamFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TextField, SelectField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import {
  PageHeader,
  Card,
  CardHeader,
  StatTile,
  Tabs,
  Button,
  IconButton,
  Badge,
  MandateBadge,
  Alert,
  EmptyState,
  LoadingBlock,
  Skeleton,
  Table,
  THead,
  TBody,
  TR,
  TD,
  TDPrimary,
  TDActions,
} from '../components/ui';
import {
  listTeams,
  archiveTeam,
  listActiveMandates,
  assignMandate,
  endMandate,
  transferMemberTeam,
} from '../services/governanceService';
import { searchMembers } from '../services/memberService';
import { GOVERNANCE_STRUCTURE_ROLES, hasRole } from '../utils/roles';

const MANDATE_ROLE_OPTIONS = [
  { value: 'DIRECTOR', label: 'Directeur' },
  { value: 'VICE_DIRECTOR', label: 'Vice-directeur' },
  { value: 'TEAM_LEADER', label: "Chef d'équipe" },
];

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/** One node of the governance chart. */
function GovernanceNode({ role, mandate, icon: Icon, subtitle, emphasis = false }) {
  return (
    <div
      className={`rounded-card border p-5 text-center transition-colors duration-150
        ${
          mandate
            ? emphasis
              ? 'border-lias-mandate/40 bg-lias-mandate-bg/60'
              : 'border-lias-border bg-lias-surface'
            : 'border-dashed border-lias-border bg-lias-surface-muted/50'
        }`}
    >
      <div
        className={`w-11 h-11 rounded-full mx-auto flex items-center justify-center mb-3
          ${mandate ? 'bg-lias-mandate-bg text-lias-mandate-text' : 'bg-lias-surface-muted text-lias-faint'}`}
      >
        <Icon size={19} />
      </div>
      <MandateBadge role={role} active={Boolean(mandate)} size="sm" />
      <div className="mt-3 text-[14px] font-semibold text-lias-navy">
        {mandate ? mandate.memberName : 'Poste vacant'}
      </div>
      <div className="text-[11.5px] text-lias-muted mt-1 font-mono">
        {mandate ? `En mandat depuis le ${new Date(mandate.startDate).toLocaleDateString('fr-FR')}` : subtitle}
      </div>
    </div>
  );
}

export default function GouvernancePage({ user }) {
  const [tab, setTab] = useState('structure');
  const toast = useToasts();

  // The route lets SYSTEM_ADMIN / DIRECTOR / VICE_DIRECTOR in, but team CRUD and
  // mandate assign/end are DIRECTOR + admin only on the backend. Hide those
  // controls from a VICE_DIRECTOR rather than let them click into a 403.
  const canManageStructure = hasRole(user, GOVERNANCE_STRUCTURE_ROLES);

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
  const [endTarget, setEndTarget] = useState(null);
  const [ending, setEnding] = useState(false);

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

  const director = useMemo(() => mandates.find((m) => m.role === 'DIRECTOR') ?? null, [mandates]);
  const viceDirector = useMemo(() => mandates.find((m) => m.role === 'VICE_DIRECTOR') ?? null, [mandates]);
  const teamLeaders = useMemo(() => mandates.filter((m) => m.role === 'TEAM_LEADER'), [mandates]);

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
      toast.success('Mandat attribué — les permissions correspondantes sont actives immédiatement.');
      setAssignForm({ memberId: '', role: 'TEAM_LEADER', teamId: '', startDate: '' });
      loadMandates();
      loadTeams();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'attribution du mandat"));
    } finally {
      setAssigning(false);
    }
  }

  async function handleEndMandate() {
    setEnding(true);
    try {
      await endMandate(endTarget.id, { endDate: new Date().toISOString().slice(0, 10) });
      toast.success('Mandat clôturé — le rôle effectif du membre a été recalculé.');
      setEndTarget(null);
      loadMandates();
      loadTeams();
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la clôture du mandat'));
    } finally {
      setEnding(false);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!transferForm.memberId || !transferForm.newTeamId || !transferForm.effectiveDate) return;
    setTransferring(true);
    try {
      await transferMemberTeam(transferForm);
      toast.success('Membre transféré — la période précédente reste historisée.');
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

      <PageHeader
        eyebrow="Direction & organisation"
        title="Gouvernance du laboratoire"
        description="Structure de direction, équipes de recherche et mandats. Un mandat est une responsabilité datée : il accorde les permissions correspondantes pendant sa durée, et les retire à son terme."
        actions={
          <Tabs
            tabs={[
              { key: 'structure', label: 'Structure', icon: Network },
              { key: 'teams', label: 'Équipes', icon: Users2 },
              { key: 'mandates', label: 'Mandats', icon: ShieldCheck },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile
          label="Équipes de recherche"
          value={teams.length}
          hint="Chacune pilotée par un chef d'équipe"
          icon={Users2}
          loading={teamsLoading}
        />
        <StatTile
          label="Mandats actifs"
          value={mandates.length}
          hint="Direction et chefs d'équipe"
          icon={ShieldCheck}
          loading={mandatesLoading}
        />
        <StatTile
          label="Direction en exercice"
          value={director ? 1 : 0}
          hint={director ? director.memberName : 'Aucun directeur en mandat'}
          hintTone={director ? 'success' : 'warning'}
          icon={Crown}
          loading={mandatesLoading}
        />
      </div>

      {/* ---------------- Structure ---------------- */}
      {tab === 'structure' && (
        <>
          <Alert tone="info" className="mb-5" title="Statut ≠ Rôle ≠ Mandat">
            Le <strong>statut</strong> dit à quelle catégorie de membres une personne appartient
            (permanent, associé, doctorant…). Le <strong>mandat</strong> est une responsabilité de
            gouvernance avec une date de début et de fin. Le <strong>rôle</strong> effectif — celui
            que lit la sécurité applicative — est <strong>dérivé</strong> des deux : il n'est jamais
            saisi manuellement, et il disparaît automatiquement à la fin du mandat.
          </Alert>

          <Card className="mb-5">
            <CardHeader
              icon={Network}
              title="Organigramme de direction"
              description="Déterminé exclusivement par les mandats actuellement actifs"
            />
            <div className="p-5.5">
              {mandatesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-40 rounded-card" />
                  <Skeleton className="h-40 rounded-card" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <GovernanceNode
                      role="DIRECTOR"
                      mandate={director}
                      icon={Crown}
                      emphasis
                      subtitle="Aucun mandat de direction en cours"
                    />
                    <GovernanceNode
                      role="VICE_DIRECTOR"
                      mandate={viceDirector}
                      icon={UserCog}
                      subtitle="Aucun vice-directeur en mandat"
                    />
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-lias-border" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lias-faint">
                        Chefs d'équipe
                      </span>
                      <div className="h-px flex-1 bg-lias-border" />
                    </div>

                    {teamLeaders.length === 0 ? (
                      <div className="text-[13px] text-lias-muted text-center py-6 border border-dashed border-lias-border rounded-card">
                        Aucun chef d'équipe en mandat pour le moment.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {teamLeaders.map((m) => (
                          <div
                            key={m.id}
                            className="border border-lias-border rounded-card p-4 flex items-center gap-3"
                          >
                            <div className="w-9 h-9 rounded-lg bg-lias-blue-tint-solid flex items-center justify-center shrink-0">
                              <Users2 size={16} className="text-lias-blue-dark" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-lias-ink truncate">
                                {m.memberName}
                              </div>
                              <div className="text-[11.5px] text-lias-muted truncate">
                                {m.teamName ?? 'Équipe non précisée'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ---------------- Équipes ---------------- */}
      {tab === 'teams' && (
        <>
          {teamsError && (
            <Alert tone="danger" className="mb-5">
              {teamsError}
            </Alert>
          )}

          {!canManageStructure && (
            <Alert tone="info" className="mb-5" icon={Info}>
              Vous consultez la structure des équipes en lecture seule. La création, la modification et
              l'archivage d'une équipe sont réservés au directeur en exercice ou à l'administration ;
              le transfert d'un membre entre équipes reste à votre main.
            </Alert>
          )}

          <Card className="mb-5">
            <CardHeader
              icon={Users2}
              title="Équipes de recherche"
              description="Le responsable d'une équipe est déterminé par son mandat TEAM_LEADER actif."
              actions={
                canManageStructure ? (
                  <Button
                    icon={Plus}
                    size="sm"
                    onClick={() => {
                      setEditingTeam(null);
                      setFormOpen(true);
                    }}
                  >
                    Nouvelle équipe
                  </Button>
                ) : null
              }
            />

            {teamsLoading ? (
              <LoadingBlock label="Chargement des équipes..." />
            ) : teams.length === 0 ? (
              <EmptyState
                icon={Users2}
                title="Aucune équipe de recherche"
                description="Structurez le laboratoire en créant sa première équipe de recherche."
                action={
                  canManageStructure ? (
                    <Button
                      icon={Plus}
                      onClick={() => {
                        setEditingTeam(null);
                        setFormOpen(true);
                      }}
                    >
                      Créer une équipe
                    </Button>
                  ) : null
                }
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-lias-border-light">
                {teams.map((t) => (
                  <div key={t.id} className="bg-lias-surface p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="m-0 text-[14.5px] font-semibold text-lias-navy">{t.name}</h3>
                        <p className="mt-1.5 mb-0 text-[12.5px] text-lias-muted leading-relaxed line-clamp-2">
                          {t.description || 'Aucune description renseignée.'}
                        </p>
                      </div>
                      {canManageStructure && (
                        <div className="flex gap-2 shrink-0">
                          <IconButton
                            icon={Pencil}
                            label="Modifier"
                            onClick={() => {
                              setEditingTeam(t);
                              setFormOpen(true);
                            }}
                          />
                          <IconButton
                            icon={Archive}
                            label="Archiver"
                            variant="danger"
                            onClick={() => setArchiveTarget(t)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 pt-4 border-t border-lias-border-light">
                      <div>
                        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-lias-faint mb-1">
                          Responsable
                        </div>
                        {t.currentLeaderName ? (
                          <span className="flex items-center gap-1.5 text-[12.5px] text-lias-ink">
                            <MandateBadge role="TEAM_LEADER" size="sm" />
                            {t.currentLeaderName}
                          </span>
                        ) : (
                          <Badge tone="warning" size="sm">
                            Aucun chef d'équipe
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-lias-faint mb-1">
                          Membres
                        </div>
                        <span className="text-[12.5px] font-semibold text-lias-navy tabular-nums">
                          {t.memberCount}
                        </span>
                      </div>
                      {t.creationDate && (
                        <div>
                          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-lias-faint mb-1">
                            Créée le
                          </div>
                          <span className="text-[12.5px] text-lias-muted font-mono">
                            {new Date(t.creationDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padded>
            <div className="flex items-center gap-2 text-[13.5px] font-semibold text-lias-navy mb-1.5">
              <ArrowRightLeft size={15} className="text-lias-blue-dark" />
              Transférer un membre vers une autre équipe
            </div>
            <p className="text-[12.5px] text-lias-muted mt-0 mb-4">
              L'appartenance précédente est clôturée et conservée : l'historique d'équipe reste complet.
            </p>
            <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 items-start">
              <SelectField
                label="Membre"
                required
                value={transferForm.memberId}
                onChange={(e) => setTransferForm({ ...transferForm, memberId: e.target.value })}
              >
                <option value="">— Sélectionner —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Nouvelle équipe"
                required
                value={transferForm.newTeamId}
                onChange={(e) => setTransferForm({ ...transferForm, newTeamId: e.target.value })}
              >
                <option value="">— Sélectionner —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Date d'effet"
                type="date"
                required
                value={transferForm.effectiveDate}
                onChange={(e) => setTransferForm({ ...transferForm, effectiveDate: e.target.value })}
              />
              <Button type="submit" variant="secondary" icon={ArrowRightLeft} loading={transferring} className="mt-6">
                Transférer
              </Button>
            </form>
          </Card>
        </>
      )}

      {/* ---------------- Mandats ---------------- */}
      {tab === 'mandates' && (
        <>
          {!canManageStructure && (
            <Alert tone="info" className="mb-5" icon={Info}>
              En tant que vice-directeur, vous pouvez <strong>consulter</strong> les mandats en cours.
              L'attribution et la clôture d'un mandat relèvent du directeur en exercice ou de
              l'administration.
            </Alert>
          )}

          {canManageStructure && (
          <Card className="mb-5" padded>
            <div className="flex items-center gap-2 text-[13.5px] font-semibold text-lias-navy mb-1.5">
              <ShieldCheck size={15} className="text-lias-blue-dark" />
              Attribuer un mandat
            </div>
            <p className="text-[12.5px] text-lias-muted mt-0 mb-4 leading-relaxed">
              Attribuer un mandat de Directeur ou de Vice-directeur clôture automatiquement celui du
              titulaire précédent : il ne peut y avoir qu'un seul titulaire actif à la fois. Les permissions
              suivent immédiatement.
            </p>
            <form onSubmit={handleAssignMandate} className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 items-start">
              <SelectField
                label="Membre"
                required
                value={assignForm.memberId}
                onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
              >
                <option value="">— Sélectionner —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Responsabilité"
                required
                value={assignForm.role}
                onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
              >
                {MANDATE_ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
              {assignForm.role === 'TEAM_LEADER' ? (
                <SelectField
                  label="Équipe"
                  required
                  value={assignForm.teamId}
                  onChange={(e) => setAssignForm({ ...assignForm, teamId: e.target.value })}
                >
                  <option value="">— Sélectionner —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </SelectField>
              ) : (
                <div className="hidden sm:block" />
              )}
              <TextField
                label="Date de début"
                type="date"
                required
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
              />
              <Button type="submit" icon={Plus} loading={assigning} className="sm:col-start-4 mt-1">
                Attribuer le mandat
              </Button>
            </form>
          </Card>
          )}

          {mandatesError && (
            <Alert tone="danger" className="mb-5">
              {mandatesError}
            </Alert>
          )}

          <Card>
            <CardHeader
              icon={CalendarClock}
              title="Mandats actifs"
              description="Seuls les mandats en cours sont listés ; l'historique complet est visible sur la fiche de chaque membre."
            />
            {mandatesLoading ? (
              <LoadingBlock label="Chargement des mandats..." />
            ) : mandates.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="Aucun mandat actif"
                description="Aucune responsabilité de gouvernance n'est actuellement attribuée."
              />
            ) : (
              <Table minWidth="min-w-[720px]">
                <THead
                  columns={[
                    'Membre',
                    'Responsabilité',
                    'Équipe',
                    'Début du mandat',
                    ...(canManageStructure ? [{ label: 'Actions', align: 'right' }] : []),
                  ]}
                />
                <TBody>
                  {mandates.map((m) => (
                    <TR key={m.id}>
                      <TDPrimary title={m.memberName} />
                      <TD>
                        <MandateBadge role={m.role} />
                      </TD>
                      <TD className="text-lias-muted">{m.teamName || '—'}</TD>
                      <TD className="text-lias-muted font-mono text-[12.5px]">
                        {new Date(m.startDate).toLocaleDateString('fr-FR')}
                      </TD>
                      {canManageStructure && (
                        <TDActions>
                          <Button size="sm" variant="secondary" icon={Square} onClick={() => setEndTarget(m)}>
                            Terminer
                          </Button>
                        </TDActions>
                      )}
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          <div className="mt-4 flex items-start gap-2 text-[12px] text-lias-muted">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>
              Clôturer un mandat ne le supprime pas : la période est conservée avec sa date de fin, et le
              rôle effectif du membre est immédiatement recalculé à partir de son statut et de ses éventuels
              autres mandats.
            </span>
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
        message={`L'équipe « ${archiveTarget?.name} » sera archivée (suppression logique). Publications et historiques d'appartenance restent conservés.`}
        confirmLabel="Archiver"
        loading={archiving}
        onConfirm={handleArchiveTeam}
        onCancel={() => setArchiveTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(endTarget)}
        title="Terminer ce mandat"
        message={`Le mandat de ${endTarget?.memberName} prendra fin aujourd'hui. La période sera conservée dans l'historique et les permissions associées seront retirées immédiatement.`}
        confirmLabel="Terminer le mandat"
        tone="warning"
        loading={ending}
        onConfirm={handleEndMandate}
        onCancel={() => setEndTarget(null)}
      />
    </div>
  );
}
