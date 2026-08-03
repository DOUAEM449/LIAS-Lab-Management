import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { TextField, TextAreaField, SelectField, FileField } from './FormField';
import { createPublication, updatePublication, uploadPublicationPdf } from '../services/publicationService';
import { searchMembers } from '../services/memberService';
import { listTeams } from '../services/governanceService';

const EMPTY_FORM = {
  title: '',
  abstractText: '',
  keywords: '',
  year: new Date().getFullYear(),
  doi: '',
  teamId: '',
  authorMemberIds: [],
};

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function PublicationFormModal({ open, publication, onClose, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(publication);

  useEffect(() => {
    if (!open) return;
    setForm(
      publication
        ? {
            title: publication.title ?? '',
            abstractText: publication.abstractText ?? '',
            keywords: publication.keywords ?? '',
            year: publication.year ?? new Date().getFullYear(),
            doi: publication.doi ?? '',
            teamId: publication.teamId ?? '',
            authorMemberIds: publication.authors?.map((a) => a.memberId) ?? [],
          }
        : EMPTY_FORM
    );
    setPdfFile(null);
    Promise.all([searchMembers({ page: 0, size: 200, sort: 'lastName,asc' }), listTeams()])
      .then(([m, t]) => {
        setMembers(m.content);
        setTeams(t);
      })
      .catch(() => {});
  }, [open, publication]);

  if (!open) return null;

  function toggleAuthor(memberId) {
    setForm((f) => ({
      ...f,
      authorMemberIds: f.authorMemberIds.includes(memberId)
        ? f.authorMemberIds.filter((id) => id !== memberId)
        : [...f.authorMemberIds, memberId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.authorMemberIds.length === 0) {
      toast.error('Sélectionnez au moins un auteur.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        abstractText: form.abstractText || undefined,
        keywords: form.keywords || undefined,
        year: Number(form.year),
        doi: form.doi || undefined,
        teamId: form.teamId || undefined,
        authorMemberIds: form.authorMemberIds,
      };
      const saved = isEdit
        ? await updatePublication(publication.id, payload)
        : await createPublication(payload);

      let finalSaved = saved;
      if (pdfFile) {
        finalSaved = await uploadPublicationPdf(saved.id, pdfFile);
      }

      toast.success(isEdit ? 'Publication mise à jour.' : 'Publication créée.');
      onSaved(finalSaved);
      onClose();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'enregistrement de la publication"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={isEdit ? 'Modifier la publication' : 'Nouvelle publication'}
    >
      <form onSubmit={handleSubmit}>
        <TextField
          label="Titre"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <TextAreaField
          label="Résumé"
          value={form.abstractText}
          onChange={(e) => setForm({ ...form, abstractText: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-x-4">
          <TextField
            label="Année"
            type="number"
            required
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
          <TextField
            label="DOI"
            value={form.doi}
            onChange={(e) => setForm({ ...form, doi: e.target.value })}
          />
        </div>
        <TextField
          label="Mots-clés"
          placeholder="séparés par des virgules"
          value={form.keywords}
          onChange={(e) => setForm({ ...form, keywords: e.target.value })}
        />
        <SelectField label="Équipe" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
          <option value="">— Aucune —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </SelectField>

        <label className="block mb-3.5">
          <span className="block text-xs font-medium text-lias-muted mb-1.5">
            Auteurs <span className="text-lias-danger-text">*</span>
          </span>
          <div className="border border-lias-border rounded-lg max-h-40 overflow-y-auto p-2">
            {members.map((m) => (
              <label key={m.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.authorMemberIds.includes(m.id)}
                  onChange={() => toggleAuthor(m.id)}
                />
                {m.firstName} {m.lastName}
              </label>
            ))}
          </div>
        </label>

        <FileField label="PDF" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Enregistrer' : 'Créer la publication'}
        </button>
      </form>
    </Modal>
  );
}
