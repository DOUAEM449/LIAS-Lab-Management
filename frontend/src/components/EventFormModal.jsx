import { useEffect, useState } from 'react';
import { Loader2, Users, UserPlus, Image } from 'lucide-react';
import Modal from './Modal';
import { TextField, TextAreaField, SelectField, FileField } from './FormField';
import {
  createEvent,
  updateEvent,
  listEventParticipants,
  registerForEvent,
  uploadEventBanner,
} from '../services/eventService';
import { searchMembers } from '../services/memberService';

const EMPTY_FORM = {
  type: 'SEMINAR',
  title: '',
  description: '',
  editionNumber: '',
  startDate: '',
  endDate: '',
  location: '',
  organizerMemberIds: [],
};

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

function toLocalDateTimeInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventFormModal({ open, event, onClose, onSaved, toast, currentMemberId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);

  const [participants, setParticipants] = useState([]);
  const [registering, setRegistering] = useState(false);

  const isEdit = Boolean(event);
  const alreadyRegistered = participants.some((p) => p.memberId === currentMemberId);

  useEffect(() => {
    if (!open) return;
    setForm(
      event
        ? {
            type: event.type ?? 'SEMINAR',
            title: event.title ?? '',
            description: event.description ?? '',
            editionNumber: event.editionNumber ?? '',
            startDate: toLocalDateTimeInput(event.startDate),
            endDate: toLocalDateTimeInput(event.endDate),
            location: event.location ?? '',
            organizerMemberIds: event.organizers?.map((o) => o.memberId) ?? [],
          }
        : EMPTY_FORM
    );
    setBannerFile(null);
    setParticipants([]);
    searchMembers({ page: 0, size: 200, sort: 'lastName,asc' })
      .then((res) => setMembers(res.content))
      .catch(() => {});
    if (event) {
      listEventParticipants(event.id)
        .then(setParticipants)
        .catch(() => {});
    }
  }, [open, event]);

  if (!open) return null;

  function toggleOrganizer(memberId) {
    setForm((f) => ({
      ...f,
      organizerMemberIds: f.organizerMemberIds.includes(memberId)
        ? f.organizerMemberIds.filter((id) => id !== memberId)
        : [...f.organizerMemberIds, memberId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        editionNumber: form.editionNumber ? Number(form.editionNumber) : undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        location: form.location || undefined,
        organizerMemberIds: form.organizerMemberIds,
      };
      let saved = isEdit ? await updateEvent(event.id, payload) : await createEvent(payload);
      if (bannerFile) {
        saved = await uploadEventBanner(saved.id, bannerFile);
      }
      toast.success(isEdit ? 'Événement mis à jour.' : 'Événement créé.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'enregistrement de l'événement"));
    } finally {
      setSaving(false);
    }
  }

  async function handleRegister() {
    if (!currentMemberId || !event) return;
    setRegistering(true);
    try {
      await registerForEvent(event.id, currentMemberId);
      const refreshed = await listEventParticipants(event.id);
      setParticipants(refreshed);
      toast.success('Inscription confirmée.');
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'inscription"));
    } finally {
      setRegistering(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-xl" title={isEdit ? "Modifier l'événement" : 'Nouvel événement'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-x-4">
          <SelectField label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="CONFERENCE">Conférence</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="SEMINAR">Séminaire</option>
          </SelectField>
          <TextField
            label="N° édition"
            type="number"
            value={form.editionNumber}
            onChange={(e) => setForm({ ...form, editionNumber: e.target.value })}
          />
        </div>
        <TextField
          label="Titre"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <TextAreaField
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-x-4">
          <TextField
            label="Début"
            type="datetime-local"
            required
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <TextField
            label="Fin"
            type="datetime-local"
            required
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
        <TextField
          label="Lieu"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <label className="block mb-3.5">
          <span className="block text-xs font-medium text-lias-muted mb-1.5">Organisateurs</span>
          <div className="border border-lias-border rounded-lg max-h-32 overflow-y-auto p-2">
            {members.map((m) => (
              <label key={m.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.organizerMemberIds.includes(m.id)}
                  onChange={() => toggleOrganizer(m.id)}
                />
                {m.firstName} {m.lastName}
              </label>
            ))}
          </div>
        </label>

        <FileField label="Bannière" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Enregistrer' : "Créer l'événement"}
        </button>
      </form>

      {isEdit && (
        <div className="border-t border-lias-border-light mt-5 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-lias-muted uppercase tracking-wide">
              <Users size={14} />
              Participants ({participants.length})
            </div>
            {currentMemberId && !alreadyRegistered && (
              <button
                type="button"
                onClick={handleRegister}
                disabled={registering}
                className="flex items-center gap-1.5 text-xs bg-lias-blue text-white border-none rounded-lg px-3 py-1.5 cursor-pointer disabled:opacity-50"
              >
                {registering ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                S'inscrire
              </button>
            )}
            {alreadyRegistered && <span className="text-xs text-lias-success">Vous êtes inscrit(e)</span>}
          </div>
          {participants.length > 0 ? (
            <ul className="list-none p-0 m-0 space-y-1">
              {participants.map((p) => (
                <li key={p.id} className="text-sm text-lias-ink">
                  {p.fullName}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-lias-muted">Aucun participant inscrit.</div>
          )}
        </div>
      )}
    </Modal>
  );
}
