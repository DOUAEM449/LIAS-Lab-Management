import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './ui/Button';
import { Alert } from './ui/Feedback';
import { TextField, SelectField, FileField } from './FormField';
import { uploadDocument, updateDocumentMetadata } from '../services/documentService';
import { listEventOptions } from '../services/eventService';

export const DOCUMENT_CATEGORY_LABEL = {
  FUNDING_REQUEST: 'Demande de financement',
  PROGRAM: 'Programme',
  CERTIFICATE: 'Attestation',
  REPORT: 'Rapport',
  ADMINISTRATIVE: 'Document administratif',
  AGREEMENT: 'Convention',
  MEETING_MINUTES: 'Procès-verbal',
  PUBLICATION: 'Publication',
  OTHER: 'Autre',
};

const EMPTY = { title: '', category: 'ADMINISTRATIVE', tags: '', relatedEventId: '' };

export default function DocumentFormModal({ open, document, onClose, onSaved, toast }) {
  const isEdit = Boolean(document);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFile(null);
    setForm(
      document
        ? {
            title: document.title ?? '',
            category: document.category ?? 'ADMINISTRATIVE',
            tags: document.tags ?? '',
            relatedEventId: document.relatedEventId ?? '',
          }
        : EMPTY
    );
    listEventOptions()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [open, document]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isEdit && !file) {
      setError('Veuillez sélectionner un fichier à archiver.');
      return;
    }
    setSaving(true);
    setError(null);

    const metadata = {
      title: form.title.trim(),
      category: form.category,
      tags: form.tags.trim() || null,
      relatedEventId: form.relatedEventId || null,
    };

    try {
      if (isEdit) {
        await updateDocumentMetadata(document.id, metadata);
        toast?.success('Document mis à jour.');
      } else {
        await uploadDocument(metadata, file);
        toast?.success('Document archivé.');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.status === 403
          ? "Vous n'avez pas les droits nécessaires pour cette action."
          : err.response?.data?.message || "Échec de l'enregistrement du document"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Modifier le document' : 'Archiver un document'}
      subtitle={
        isEdit
          ? 'Les métadonnées sont modifiables ; le fichier se met à jour via une nouvelle version.'
          : "Le document est classé par catégorie et, si besoin, rattaché à un événement."
      }
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <TextField
          label="Titre du document"
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Ex. Convention de partenariat 2026"
        />

        <SelectField
          label="Catégorie"
          required
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
        >
          {Object.entries(DOCUMENT_CATEGORY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Mots-clés"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="convention, financement, 2026"
          hint="Séparés par des virgules — utilisés par la recherche."
        />

        <SelectField
          label="Événement associé"
          value={form.relatedEventId}
          onChange={(e) => set('relatedEventId', e.target.value)}
          hint="Optionnel : classe le document sous un événement (CdC §2.10)."
        >
          <option value="">— Aucun —</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </SelectField>

        {!isEdit && (
          <FileField
            label="Fichier"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            hint="25 Mo maximum."
          />
        )}

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1" loading={saving}>
            {isEdit ? 'Enregistrer' : 'Archiver'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
