import { useEffect, useState } from 'react';
import { Loader2, History, Archive } from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { TextField, TextAreaField, SelectField } from './FormField';
import {
  getMember,
  updateMember,
  changeMemberStatus,
  archiveMember,
  getMemberStatusHistory,
  getMemberAffiliationHistory,
} from '../services/memberService';

const STATUS_OPTIONS = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'ASSOCIATE', label: 'Associé' },
  { value: 'PHD_STUDENT', label: 'Doctorant' },
  { value: 'RETIRED', label: 'Retraité' },
  { value: 'FORMER', label: 'Ancien membre' },
];

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function MemberDetailsModal({ memberId, onClose, onUpdated, onArchivedOrRestored, toast }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const [statusHistory, setStatusHistory] = useState(null);
  const [affiliationHistory, setAffiliationHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [statusDate, setStatusDate] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    setShowHistory(false);
    setStatusHistory(null);
    setAffiliationHistory(null);
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
      })
      .catch((err) => toast.error(friendlyError(err, 'Échec du chargement du profil')))
      .finally(() => setLoading(false));
  }, [memberId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!memberId) return null;

  async function handleSave() {
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
      toast.success('Statut du membre mis à jour.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du changement de statut'));
    } finally {
      setStatusSaving(false);
    }
  }

  async function loadHistory() {
    setShowHistory((s) => !s);
    if (statusHistory) return;
    try {
      const [statuses, affiliations] = await Promise.all([
        getMemberStatusHistory(memberId),
        getMemberAffiliationHistory(memberId),
      ]);
      setStatusHistory(statuses);
      setAffiliationHistory(affiliations);
    } catch (err) {
      toast.error(friendlyError(err, "Échec du chargement de l'historique"));
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
        maxWidth="max-w-2xl"
        title={member ? `${member.firstName} ${member.lastName}` : 'Profil du membre'}
        subtitle={member?.currentTeamName ? `Équipe : ${member.currentTeamName}` : undefined}
      >
        {loading || !form ? (
          <div className="flex items-center justify-center py-16 text-lias-muted gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Chargement du profil...</span>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <TextField
                label="Prénom"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <TextField
                label="Nom"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <TextField
                label="Date de naissance"
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
              <TextField
                label="Établissement d'origine"
                value={form.homeInstitution}
                onChange={(e) => setForm({ ...form, homeInstitution: e.target.value })}
              />
              <TextField
                label="Laboratoire d'origine"
                value={form.homeLaboratory}
                onChange={(e) => setForm({ ...form, homeLaboratory: e.target.value })}
              />
            </div>
            <TextAreaField
              label="Biographie"
              value={form.biography}
              onChange={(e) => setForm({ ...form, biography: e.target.value })}
            />
            <TextAreaField
              label="Centres d'intérêt"
              value={form.researchInterests}
              onChange={(e) => setForm({ ...form, researchInterests: e.target.value })}
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mb-5"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Enregistrer le profil
            </button>

            <div className="border-t border-lias-border-light pt-4 mb-2">
              <div className="text-xs font-semibold text-lias-muted uppercase tracking-wide mb-3">
                Changer le statut
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                <SelectField label="Nouveau statut" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
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
                  label="Raison (optionnel)"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>
              <button
                onClick={handleChangeStatus}
                disabled={statusSaving || newStatus === member.currentStatus}
                className="bg-white border border-lias-border text-lias-ink rounded-lg py-2 px-4 text-sm font-medium cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {statusSaving && <Loader2 size={14} className="animate-spin" />}
                Appliquer le changement de statut
              </button>
            </div>

            <div className="border-t border-lias-border-light pt-4 mb-2">
              <button
                onClick={loadHistory}
                className="flex items-center gap-2 text-sm text-lias-blue-dark bg-transparent border-none cursor-pointer p-0"
              >
                <History size={15} />
                {showHistory ? "Masquer l'historique" : "Voir l'historique"}
              </button>

              {showHistory && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] font-semibold text-lias-muted uppercase mb-2">
                      Historique de statut
                    </div>
                    {!statusHistory ? (
                      <Loader2 size={14} className="animate-spin text-lias-muted" />
                    ) : statusHistory.length === 0 ? (
                      <div className="text-xs text-lias-muted">Aucun historique.</div>
                    ) : (
                      <ul className="text-xs text-lias-ink space-y-1.5 list-none p-0 m-0">
                        {statusHistory.map((h) => (
                          <li key={h.id} className="border-l-2 border-lias-blue-tint pl-2">
                            <span className="font-medium">{h.status}</span> — {h.startDate}
                            {h.endDate ? ` → ${h.endDate}` : ' → présent'}
                            {h.reason && <div className="text-lias-muted">{h.reason}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-lias-muted uppercase mb-2">
                      Historique d'affiliation
                    </div>
                    {!affiliationHistory ? (
                      <Loader2 size={14} className="animate-spin text-lias-muted" />
                    ) : affiliationHistory.length === 0 ? (
                      <div className="text-xs text-lias-muted">Aucun historique.</div>
                    ) : (
                      <ul className="text-xs text-lias-ink space-y-1.5 list-none p-0 m-0">
                        {affiliationHistory.map((h) => (
                          <li key={h.id} className="border-l-2 border-lias-blue-tint pl-2">
                            {h.startDate}
                            {h.endDate ? ` → ${h.endDate}` : ' → présent'}
                            {h.reason && <div className="text-lias-muted">{h.reason}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-lias-border-light pt-4">
              <button
                onClick={() => setConfirmArchive(true)}
                className="flex items-center gap-2 text-sm text-rose-600 bg-transparent border-none cursor-pointer p-0"
              >
                <Archive size={15} />
                Archiver ce membre
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmArchive}
        title="Archiver ce membre"
        message="Le membre sera archivé (soft delete) — son historique sera conservé mais il n'apparaîtra plus dans les listes actives."
        confirmLabel="Archiver"
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchive(false)}
      />
    </>
  );
}
