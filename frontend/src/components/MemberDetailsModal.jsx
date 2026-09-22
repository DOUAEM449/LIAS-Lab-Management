import { useEffect, useState } from 'react';
import {
  History,
  Archive,
  Trash2,
  Lock,
  RotateCcw,
  IdCard,
  ShieldCheck,
  UserCog,
  Info,
} from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { TextField, TextAreaField, SelectField, FieldRow } from './FormField';
import Button from './ui/Button';
import Badge, { StatusBadge, MandateBadge, MEMBER_STATUS_LABEL } from './ui/Badge';
import { Alert, LoadingBlock, Spinner } from './ui/Feedback';
import { Tabs, Field } from './ui/Layout';
import {
  getMember,
  updateMember,
  changeMemberStatus,
  archiveMember,
  deleteMyAvatar,
  returnMemberToLab,
  getMemberStatusHistory,
  getMemberAffiliationHistory,
} from '../services/memberService';
import { getMemberMandates } from '../services/governanceService';
import { MEMBER_ADMIN_ROLES, MEMBER_PROFILE_EDIT_ROLES, hasRole } from '../utils/roles';
import Avatar from './ui/Avatar';

const STATUS_OPTIONS = Object.entries(MEMBER_STATUS_LABEL).map(([value, label]) => ({ value, label }));

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/**
 * Member profile panel.
 *
 * currentUser / myMemberId enforce, on the frontend, the same rules the backend
 * already applies — CdC: "un membre ne peut modifier QUE son propre profil",
 * archiving and status changes reserved to ADMIN / DIRECTEUR EN MANDAT.
 *
 * The header deliberately shows STATUT, RÔLE and MANDAT side by side: the CdC
 * (§2.21) requires these three to remain distinct, and the interface is where
 * that distinction has to become legible.
 */
export default function MemberDetailsModal({
  memberId,
  currentUser,
  myMemberId,
  onClose,
  onUpdated,
  onArchivedOrRestored,
  toast,
}) {
  const isSelf = Boolean(memberId) && memberId === myMemberId;
  const canEdit = isSelf || hasRole(currentUser, MEMBER_PROFILE_EDIT_ROLES);
  const canAdminister = hasRole(currentUser, MEMBER_ADMIN_ROLES);

  const [tab, setTab] = useState('profile');
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [member, setMember] = useState(null);
  const [mandates, setMandates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const [statusHistory, setStatusHistory] = useState(null);
  const [affiliationHistory, setAffiliationHistory] = useState(null);

  const [newStatus, setNewStatus] = useState('');
  const [statusDate, setStatusDate] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [returnDate, setReturnDate] = useState('');
  const [returnStatus, setReturnStatus] = useState('PERMANENT');
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    setTab('profile');
    setStatusHistory(null);
    setAffiliationHistory(null);
    setMandates([]);

    getMember(memberId)
      .then((m) => {
        setMember(m);
        setForm({
          firstName: m.firstName ?? '',
          lastName: m.lastName ?? '',
          email: m.email ?? '',
          photoUrl: m.photoUrl ?? '',
          birthDate: m.birthDate ?? '',
          homeInstitution: m.homeInstitution ?? '',
          homeLaboratory: m.homeLaboratory ?? '',
          biography: m.biography ?? '',
          researchInterests: m.researchInterests ?? '',
        });
        setNewStatus(m.currentStatus);
        setStatusDate(new Date().toISOString().slice(0, 10));
        setReturnDate(new Date().toISOString().slice(0, 10));
      })
      .catch((err) => toast.error(friendlyError(err, 'Échec du chargement du profil')))
      .finally(() => setLoading(false));

    // Mandates are what actually grant governance permissions — load them so the
    // profile can show the responsibility alongside the membership status.
    getMemberMandates(memberId)
      .then(setMandates)
      .catch(() => setMandates([]));
  }, [memberId]); // eslint-disable-line react-hooks/exhaustive-deps

  // History is only fetched when the user opens that tab.
  useEffect(() => {
    if (tab !== 'history' || !memberId || statusHistory) return;
    Promise.all([getMemberStatusHistory(memberId), getMemberAffiliationHistory(memberId)])
      .then(([statuses, affiliations]) => {
        setStatusHistory(statuses);
        setAffiliationHistory(affiliations);
      })
      .catch((err) => toast.error(friendlyError(err, "Échec du chargement de l'historique")));
  }, [tab, memberId, statusHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!memberId) return null;

  const activeMandates = mandates.filter((m) => m.active && !m.endDate);
  const pastMandates = mandates.filter((m) => !m.active || m.endDate);
  const isFrozen = member?.currentStatus === 'RETIRED' || member?.currentStatus === 'FORMER';

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    try {
      const updated = await updateMember(memberId, form);
      setMember(updated);
      onUpdated(updated);
      toast.success('Profil mis à jour.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la mise à jour du profil'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePhoto() {
    if (!isSelf) return;
    setAvatarDeleting(true);
    try {
      const updated = await deleteMyAvatar();
      setMember(updated);
      setForm((f) => ({ ...f, photoUrl: '' }));
      onUpdated(updated);
      toast.success('Photo de profil supprimée.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la suppression de la photo'));
    } finally {
      setAvatarDeleting(false);
    }
  }

  async function handleChangeStatus() {
    if (!newStatus || !statusDate) return;
    setStatusSaving(true);
    try {
      const updated = await changeMemberStatus(memberId, {
        newStatus,
        effectiveDate: statusDate,
        reason: statusReason || undefined,
      });
      setMember(updated);
      onUpdated(updated);
      setStatusHistory(null);
      getMemberMandates(memberId).then(setMandates).catch(() => {});
      toast.success('Statut du membre mis à jour — rôle effectif resynchronisé.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du changement de statut'));
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleReturn() {
    if (!returnDate || !returnStatus) return;
    setReturning(true);
    try {
      const updated = await returnMemberToLab(memberId, { returnDate, reinstatedStatus: returnStatus });
      setMember(updated);
      onUpdated(updated);
      setStatusHistory(null);
      toast.success("Membre réactivé — nouvelle période d'affiliation ouverte.");
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la réactivation du membre'));
    } finally {
      setReturning(false);
    }
  }

  async function handleArchive() {
    setArchiving(true);
    try {
      await archiveMember(memberId);
      toast.success('Membre archivé.');
      setConfirmArchive(false);
      onArchivedOrRestored();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'archivage du membre"));
    } finally {
      setArchiving(false);
    }
  }

  return (
    <>
      <Modal
        open={Boolean(memberId)}
        onClose={onClose}
        maxWidth="max-w-3xl"
        title={member ? `${member.firstName} ${member.lastName}` : 'Profil du membre'}
        subtitle={member?.email}
      >
        {loading || !form ? (
          <LoadingBlock label="Chargement du profil..." />
        ) : (
          <div>
            {/* --- Identity header: STATUT / RÔLE / MANDAT side by side ------- */}
            <div className="flex items-start gap-4 pb-5 mb-5 border-b border-lias-border-light">
              <Avatar
                src={form.photoUrl}
                name={`${form.firstName ?? ''} ${form.lastName ?? ''}`}
                email={form.email}
                size={64}
              />

              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-semibold text-lias-navy">
                  {member.firstName} {member.lastName}
                </div>
                <div className="text-[12.5px] text-lias-muted mt-0.5">
                  {member.currentTeamName ? `Équipe ${member.currentTeamName}` : 'Aucune équipe assignée'}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-lias-faint">
                    Statut
                  </span>
                  <StatusBadge status={member.currentStatus} size="sm" />

                  {activeMandates.length > 0 && (
                    <>
                      <span className="w-px h-4 bg-lias-border mx-1" />
                      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-lias-faint">
                        Mandat
                      </span>
                      {activeMandates.map((m) => (
                        <MandateBadge key={m.id} role={m.role} size="sm" />
                      ))}
                    </>
                  )}
                </div>

                {isSelf && form.photoUrl && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={avatarDeleting}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-lias-danger-text bg-transparent
                      border-none cursor-pointer p-0 mt-3 disabled:opacity-60"
                  >
                    {avatarDeleting ? <Spinner size={12} /> : <Trash2 size={12} />}
                    Supprimer la photo
                  </button>
                )}
              </div>
            </div>

            {isFrozen && (
              <Alert tone="warning" className="mb-5" title="Compte inactif">
                Ce membre est {member.currentStatus === 'RETIRED' ? 'retraité (compte gelé)' : 'un ancien membre (compte désactivé)'} :
                il ne peut plus se connecter, et tout mandat de gouvernance a été clôturé. Son historique reste intégralement conservé.
              </Alert>
            )}

            <Tabs
              tabs={[
                { key: 'profile', label: 'Profil', icon: IdCard },
                { key: 'governance', label: 'Gouvernance', icon: ShieldCheck },
                { key: 'history', label: 'Historique', icon: History },
                ...(canAdminister ? [{ key: 'admin', label: 'Administration', icon: UserCog }] : []),
              ]}
              active={tab}
              onChange={setTab}
              className="mb-5"
            />

            {/* --- Profil ---------------------------------------------------- */}
            {tab === 'profile' && (
              <div>
                {!canEdit && (
                  <Alert tone="info" className="mb-4">
                    <span className="flex items-center gap-1.5">
                      <Lock size={12} />
                      Lecture seule — chaque membre ne peut modifier que son propre profil.
                    </span>
                  </Alert>
                )}

                <FieldRow>
                  <TextField
                    label="Prénom"
                    required
                    disabled={!canEdit}
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                  <TextField
                    label="Nom"
                    required
                    disabled={!canEdit}
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    disabled={!canEdit}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <TextField
                    label="Date de naissance"
                    type="date"
                    disabled={!canEdit}
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    hint="Confidentielle : visible par le membre et la direction uniquement."
                  />
                  <TextField
                    label="Établissement d'origine"
                    disabled={!canEdit}
                    value={form.homeInstitution}
                    onChange={(e) => setForm({ ...form, homeInstitution: e.target.value })}
                  />
                  <TextField
                    label="Laboratoire d'origine"
                    disabled={!canEdit}
                    value={form.homeLaboratory}
                    onChange={(e) => setForm({ ...form, homeLaboratory: e.target.value })}
                  />
                </FieldRow>

                <TextAreaField
                  label="Biographie"
                  disabled={!canEdit}
                  rows={3}
                  value={form.biography}
                  onChange={(e) => setForm({ ...form, biography: e.target.value })}
                />
                <TextAreaField
                  label="Centres d'intérêt scientifiques"
                  disabled={!canEdit}
                  rows={2}
                  value={form.researchInterests}
                  onChange={(e) => setForm({ ...form, researchInterests: e.target.value })}
                />

                {canEdit && (
                  <Button className="w-full" onClick={handleSave} loading={saving}>
                    Enregistrer le profil
                  </Button>
                )}
              </div>
            )}

            {/* --- Gouvernance ------------------------------------------------ */}
            {tab === 'governance' && (
              <div>
                <Alert tone="info" className="mb-5">
                  <strong>Statut ≠ Rôle ≠ Mandat.</strong> Le <em>statut</em> est la catégorie
                  d'appartenance au laboratoire ; le <em>mandat</em> est une responsabilité de gouvernance
                  datée ; le <em>rôle</em> effectif (permissions) est <em>dérivé</em> des deux et n'est
                  jamais saisi à la main.
                </Alert>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="border border-lias-border rounded-lg p-4">
                    <Field label="Statut d'appartenance">
                      <StatusBadge status={member.currentStatus} />
                    </Field>
                    <p className="text-[11.5px] text-lias-muted mt-2.5 mb-0 leading-relaxed">
                      Change lentement (recrutement, retraite, départ). Historisé dans
                      « Historique des statuts ».
                    </p>
                  </div>

                  <div className="border border-lias-border rounded-lg p-4">
                    <Field label="Mandat de gouvernance en cours">
                      {activeMandates.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {activeMandates.map((m) => (
                            <MandateBadge key={m.id} role={m.role} />
                          ))}
                        </div>
                      ) : (
                        <Badge tone="neutral">Aucun mandat actif</Badge>
                      )}
                    </Field>
                    <p className="text-[11.5px] text-lias-muted mt-2.5 mb-0 leading-relaxed">
                      Daté (début / fin). C'est lui qui accorde les permissions de direction,
                      et il les retire automatiquement à son terme.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-3">
                  Historique des mandats
                </div>
                {mandates.length === 0 ? (
                  <div className="text-[13px] text-lias-muted py-4 text-center border border-dashed border-lias-border rounded-lg">
                    Ce membre n'a jamais exercé de mandat de gouvernance.
                  </div>
                ) : (
                  <ul className="list-none p-0 m-0">
                    {[...activeMandates, ...pastMandates].map((m) => (
                      <li key={m.id} className="relative pl-6 pb-4 last:pb-0 lias-timeline">
                        <span
                          className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-lias-surface
                            ${m.active && !m.endDate ? 'bg-lias-mandate' : 'bg-lias-border-strong'}`}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <MandateBadge role={m.role} active={m.active && !m.endDate} size="sm" />
                          {m.teamName && (
                            <span className="text-[12px] text-lias-muted">Équipe {m.teamName}</span>
                          )}
                          {m.active && !m.endDate && (
                            <Badge tone="success" size="sm">
                              En cours
                            </Badge>
                          )}
                        </div>
                        <div className="text-[12px] text-lias-muted font-mono mt-1">
                          {new Date(m.startDate).toLocaleDateString('fr-FR')}
                          {m.endDate ? ` → ${new Date(m.endDate).toLocaleDateString('fr-FR')}` : ' → en cours'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* --- Historique -------------------------------------------------- */}
            {tab === 'history' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-3">
                    Historique des statuts
                  </div>
                  {!statusHistory ? (
                    <Spinner size={15} className="text-lias-muted" />
                  ) : statusHistory.length === 0 ? (
                    <div className="text-[12.5px] text-lias-muted">Aucun historique.</div>
                  ) : (
                    <ul className="list-none p-0 m-0">
                      {statusHistory.map((h) => (
                        <li key={h.id} className="relative pl-6 pb-4 last:pb-0 lias-timeline">
                          <span
                            className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-lias-surface
                              ${h.endDate ? 'bg-lias-border-strong' : 'bg-lias-blue'}`}
                          />
                          <StatusBadge status={h.status} size="sm" />
                          <div className="text-[12px] text-lias-muted font-mono mt-1.5">
                            {h.startDate}
                            {h.endDate ? ` → ${h.endDate}` : ' → présent'}
                          </div>
                          {h.reason && (
                            <div className="text-[12px] text-lias-muted mt-1 leading-snug">{h.reason}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-3">
                    Périodes d'affiliation
                  </div>
                  {!affiliationHistory ? (
                    <Spinner size={15} className="text-lias-muted" />
                  ) : affiliationHistory.length === 0 ? (
                    <div className="text-[12.5px] text-lias-muted">Aucun historique.</div>
                  ) : (
                    <ul className="list-none p-0 m-0">
                      {affiliationHistory.map((h) => (
                        <li key={h.id} className="relative pl-6 pb-4 last:pb-0 lias-timeline">
                          <span
                            className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-lias-surface
                              ${h.endDate ? 'bg-lias-border-strong' : 'bg-lias-success'}`}
                          />
                          <div className="text-[12.5px] font-medium text-lias-ink font-mono">
                            {h.startDate}
                            {h.endDate ? ` → ${h.endDate}` : ' → présent'}
                          </div>
                          {h.reason && (
                            <div className="text-[12px] text-lias-muted mt-1 leading-snug">{h.reason}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11.5px] text-lias-muted mt-4 mb-0 leading-relaxed flex items-start gap-1.5">
                    <Info size={12} className="mt-0.5 shrink-0" />
                    Un membre peut quitter puis revenir : chaque période est conservée séparément.
                  </p>
                </div>
              </div>
            )}

            {/* --- Administration ---------------------------------------------- */}
            {tab === 'admin' && canAdminister && (
              <div className="flex flex-col gap-6">
                {isFrozen && (
                  <section>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-1.5 flex items-center gap-1.5">
                      <RotateCcw size={12} />
                      Réactiver ce membre
                    </div>
                    <p className="text-[12.5px] text-lias-muted mt-0 mb-3 leading-relaxed">
                      Ouvre une <strong>nouvelle</strong> période d'affiliation et réactive le compte,
                      sans effacer l'historique existant.
                    </p>
                    <FieldRow>
                      <SelectField
                        label="Statut de retour"
                        value={returnStatus}
                        onChange={(e) => setReturnStatus(e.target.value)}
                      >
                        {STATUS_OPTIONS.filter((o) => o.value !== 'RETIRED' && o.value !== 'FORMER').map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </SelectField>
                      <TextField
                        label="Date de retour"
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                      />
                    </FieldRow>
                    <Button icon={RotateCcw} onClick={handleReturn} loading={returning}>
                      Réactiver le membre
                    </Button>
                  </section>
                )}

                <section className={isFrozen ? 'border-t border-lias-border-light pt-6' : ''}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-1.5">
                    Changer le statut d'appartenance
                  </div>
                  <p className="text-[12.5px] text-lias-muted mt-0 mb-3 leading-relaxed">
                    Le changement est historisé. Passer à « Retraité » ou « Ancien membre » clôture
                    automatiquement les mandats en cours et gèle le compte.
                  </p>
                  <FieldRow className="sm:grid-cols-3">
                    <SelectField
                      label="Nouveau statut"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </SelectField>
                    <TextField
                      label="Date d'effet"
                      type="date"
                      value={statusDate}
                      onChange={(e) => setStatusDate(e.target.value)}
                    />
                    <TextField
                      label="Motif"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Optionnel"
                    />
                  </FieldRow>
                  <Button
                    variant="secondary"
                    onClick={handleChangeStatus}
                    loading={statusSaving}
                    disabled={newStatus === member.currentStatus}
                  >
                    Appliquer le changement de statut
                  </Button>
                </section>

                <section className="border-t border-lias-border-light pt-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-1.5">
                    Zone sensible
                  </div>
                  <p className="text-[12.5px] text-lias-muted mt-0 mb-3 leading-relaxed">
                    L'archivage est une suppression <strong>logique</strong> : le membre disparaît des listes
                    actives, mais publications, événements et historiques restent intacts.
                  </p>
                  <Button variant="danger" icon={Archive} onClick={() => setConfirmArchive(true)}>
                    Archiver ce membre
                  </Button>
                </section>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmArchive}
        title="Archiver ce membre"
        message="Le membre sera archivé (suppression logique). Son historique, ses publications et sa participation aux événements sont conservés."
        confirmLabel="Archiver"
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchive(false)}
      />
    </>
  );
}
