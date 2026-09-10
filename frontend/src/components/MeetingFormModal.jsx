import { useEffect, useState } from 'react';
import { FileText, Upload, Download, ClipboardCheck } from 'lucide-react';
import Modal from './Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { TextField, TextAreaField, FileField, FieldRow } from './FormField';
import {
  createMeeting,
  updateMeeting,
  listMeetingMinutes,
  uploadMeetingMinutes,
  downloadMeetingMinutes,
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
  const [downloadingId, setDownloadingId] = useState(null);

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
      toast.success('Procès-verbal archivé.');
      onSaved({ ...meeting, hasMinutes: true });
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du téléversement du PV'));
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(m) {
    setDownloadingId(m.id);
    try {
      await downloadMeetingMinutes(m.id, m.originalFileName);
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du téléchargement du PV'));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={isEdit ? 'Modifier la réunion' : 'Nouvelle réunion'}
      subtitle={isEdit ? 'Ordre du jour et procès-verbaux archivés' : "Planifiez une réunion interne du laboratoire"}
    >
      <form onSubmit={handleSubmit}>
        <TextField
          label="Titre de la réunion"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex. Conseil de laboratoire — rentrée 2026"
        />
        <FieldRow>
          <TextField
            label="Date et heure"
            type="datetime-local"
            required
            value={form.meetingDate}
            onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
          />
          <TextField
            label="Type de réunion"
            placeholder="Conseil, bureau, équipe..."
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
        </FieldRow>
        <TextField
          label="Lieu"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Salle, bâtiment, visioconférence..."
        />
        <TextAreaField
          label="Ordre du jour"
          rows={4}
          value={form.agenda}
          onChange={(e) => setForm({ ...form, agenda: e.target.value })}
          placeholder="Points à l'ordre du jour..."
        />

        <Button type="submit" className="w-full" loading={saving}>
          {isEdit ? 'Enregistrer les modifications' : 'Planifier la réunion'}
        </Button>
      </form>

      {isEdit && (
        <div className="border-t border-lias-border-light mt-6 pt-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-3 flex items-center gap-1.5">
            <ClipboardCheck size={12} />
            Procès-verbaux archivés
          </div>

          {minutes.length === 0 ? (
            <p className="text-[12.5px] text-lias-muted mt-0 mb-4">
              Aucun procès-verbal n'a encore été archivé pour cette réunion.
            </p>
          ) : (
            <ul className="list-none p-0 m-0 mb-4">
              {minutes.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-lias-border-light last:border-b-0"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <FileText size={14} className="text-lias-faint shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[13px] text-lias-ink truncate">{m.originalFileName}</span>
                      <span className="block text-[11px] text-lias-faint font-mono mt-0.5">
                        Archivé le {new Date(m.uploadedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Download}
                    loading={downloadingId === m.id}
                    onClick={() => handleDownload(m)}
                  >
                    Télécharger
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-start gap-3">
            <div className="flex-1">
              <FileField
                label="Ajouter un procès-verbal"
                onChange={(e) => setMinutesFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={Upload}
              onClick={handleUploadMinutes}
              disabled={!minutesFile}
              loading={uploading}
              className="mt-6"
            >
              Archiver
            </Button>
          </div>

          {minutes.length > 0 && (
            <Badge tone="success" size="sm">
              {minutes.length} PV conservé(s)
            </Badge>
          )}
        </div>
      )}
    </Modal>
  );
}
