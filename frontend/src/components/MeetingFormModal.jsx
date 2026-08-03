import { useEffect, useState } from 'react';
import { Loader2, FileText, Upload } from 'lucide-react';
import Modal from './Modal';
import { TextField, TextAreaField, FileField } from './FormField';
import {
  createMeeting,
  updateMeeting,
  listMeetingMinutes,
  uploadMeetingMinutes,
} from '../services/meetingService';

const EMPTY_FORM = { title: '', meetingDate: '', agenda: '', type: '', location: '' };

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

export default function MeetingFormModal({ open, meeting, onClose, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [minutes, setMinutes] = useState([]);
  const [minutesFile, setMinutesFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isEdit = Boolean(meeting);

  useEffect(() => {
    if (!open) return;
    setForm(
      meeting
        ? {
            title: meeting.title ?? '',
            meetingDate: toLocalDateTimeInput(meeting.meetingDate),
            agenda: meeting.agenda ?? '',
            type: meeting.type ?? '',
            location: meeting.location ?? '',
          }
        : EMPTY_FORM
    );
    setMinutesFile(null);
    setMinutes([]);
    if (meeting) {
      listMeetingMinutes(meeting.id)
        .then(setMinutes)
        .catch(() => {});
    }
  }, [open, meeting]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        meetingDate: form.meetingDate,
        agenda: form.agenda || undefined,
        type: form.type || undefined,
        location: form.location || undefined,
      };
      const saved = isEdit ? await updateMeeting(meeting.id, payload) : await createMeeting(payload);
      toast.success(isEdit ? 'Réunion mise à jour.' : 'Réunion planifiée.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'enregistrement de la réunion"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadMinutes() {
    if (!minutesFile || !meeting) return;
    setUploading(true);
    try {
      await uploadMeetingMinutes(meeting.id, minutesFile);
      const refreshed = await listMeetingMinutes(meeting.id);
      setMinutes(refreshed);
      setMinutesFile(null);
      toast.success('PV téléversé.');
      onSaved({ ...meeting, hasMinutes: true });
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du téléversement du PV'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-xl" title={isEdit ? 'Modifier la réunion' : 'Nouvelle réunion'}>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Titre"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-x-4">
          <TextField
            label="Date et heure"
            type="datetime-local"
            required
            value={form.meetingDate}
            onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
          />
          <TextField
            label="Type"
            placeholder="Conseil, bureau..."
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
        </div>
        <TextField
          label="Lieu"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <TextAreaField
          label="Ordre du jour"
          value={form.agenda}
          onChange={(e) => setForm({ ...form, agenda: e.target.value })}
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Enregistrer' : 'Planifier la réunion'}
        </button>
      </form>

      {isEdit && (
        <div className="border-t border-lias-border-light mt-5 pt-4">
          <div className="text-xs font-semibold text-lias-muted uppercase tracking-wide mb-3">
            Procès-verbaux
          </div>
          {minutes.length > 0 && (
            <ul className="list-none p-0 m-0 mb-3 space-y-1.5">
              {minutes.map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-sm text-lias-ink">
                  <FileText size={14} className="text-lias-muted" />
                  {m.originalFileName}
                  <span className="text-xs text-lias-muted">
                    ({new Date(m.uploadedAt).toLocaleDateString('fr-FR')})
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FileField label="Ajouter un PV" onChange={(e) => setMinutesFile(e.target.files[0])} />
            </div>
            <button
              type="button"
              onClick={handleUploadMinutes}
              disabled={!minutesFile || uploading}
              className="bg-white border border-lias-border rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer disabled:opacity-50 flex items-center gap-2 mb-3.5"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Téléverser
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
