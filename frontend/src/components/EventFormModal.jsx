import { useEffect, useState } from 'react';
import { Users2 } from 'lucide-react';
import Modal from './Modal';
import Button from './ui/Button';
import { TextField, TextAreaField, SelectField, FileField, FieldRow } from './FormField';
import { createEvent, updateEvent, uploadEventBanner } from '../services/eventService';
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

/**
 * Create / edit an event. Participants are consulted and joined from the events
 * list (EventParticipantsModal) rather than duplicated here — this modal owns
 * the event definition only.
 */
export default function EventFormModal({ open, event, onClose, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);

  const isEdit = Boolean(event);

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
    searchMembers({ page: 0, size: 200, sort: 'lastName,asc' })
      .then((res) => setMembers(res.content))
      .catch(() => setMembers([]));
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
      toast.success(isEdit ? 'Événement mis à jour.' : 'Événement créé — les membres en ont été notifiés.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'enregistrement de l'événement"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={isEdit ? "Modifier l'événement" : 'Nouvel événement scientifique'}
      subtitle="Conférence, workshop ou séminaire du laboratoire"
    >
      <form onSubmit={handleSubmit}>
        <FieldRow>
          <SelectField
            label="Type d'événement"
            required
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="CONFERENCE">Conférence</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="SEMINAR">Séminaire</option>
          </SelectField>
          <TextField
            label="Numéro d'édition"
            type="number"
            min={1}
            value={form.editionNumber}
            onChange={(e) => setForm({ ...form, editionNumber: e.target.value })}
            hint="Pour les événements récurrents."
          />
        </FieldRow>

        <TextField
          label="Titre"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex. Journées de l'Intelligence Artificielle"
        />
        <TextAreaField
          label="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <FieldRow>
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
        </FieldRow>

        <TextField
          label="Lieu"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Amphithéâtre, salle, ville..."
        />

        <div className="block mb-4">
          <span className="block text-[12px] font-semibold text-lias-ink-soft mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <Users2 size={12} />
              Organisateurs
            </span>
          </span>
          <div className="border border-lias-border rounded-lg max-h-40 overflow-y-auto p-2 bg-lias-surface">
            {members.length === 0 ? (
              <p className="text-[12.5px] text-lias-muted m-0 p-2">Aucun membre disponible.</p>
            ) : (
              members.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2.5 py-1.5 px-2 text-[13px] cursor-pointer rounded
                    hover:bg-lias-surface-muted transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={form.organizerMemberIds.includes(m.id)}
                    onChange={() => toggleOrganizer(m.id)}
                    className="accent-lias-blue"
                  />
                  {m.firstName} {m.lastName}
                </label>
              ))
            )}
          </div>
          <span className="block text-[11.5px] text-lias-muted mt-1.5">
            Les organisateurs désignés reçoivent une notification.
          </span>
        </div>

        <FileField
          label="Bannière de l'événement"
          accept="image/*"
          onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
          hint="Image optionnelle affichée sur la fiche de l'événement."
        />

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1" loading={saving}>
            {isEdit ? 'Enregistrer' : "Créer l'événement"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
