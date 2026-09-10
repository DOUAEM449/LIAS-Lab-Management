import { useEffect, useState } from 'react';
import { Users2 } from 'lucide-react';
import Modal from './Modal';
import Button from './ui/Button';
import { TextField, TextAreaField, SelectField, FileField, FieldRow } from './FormField';
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
      subtitle="Référencement d'un travail scientifique du laboratoire"
    >
      <form onSubmit={handleSubmit}>
        <TextField
          label="Titre de la publication"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <TextAreaField
          label="Résumé"
          rows={4}
          value={form.abstractText}
          onChange={(e) => setForm({ ...form, abstractText: e.target.value })}
          placeholder="Abstract de la publication"
        />
        <FieldRow>
          <TextField
            label="Année de publication"
            type="number"
            min={1950}
            required
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
          <TextField
            label="DOI"
            value={form.doi}
            onChange={(e) => setForm({ ...form, doi: e.target.value })}
            placeholder="10.xxxx/xxxxx"
          />
        </FieldRow>
        <TextField
          label="Mots-clés"
          placeholder="apprentissage automatique, systèmes distribués..."
          value={form.keywords}
          onChange={(e) => setForm({ ...form, keywords: e.target.value })}
          hint="Séparés par des virgules — utilisés par la recherche globale."
        />
        <SelectField
          label="Équipe de rattachement"
          value={form.teamId}
          onChange={(e) => setForm({ ...form, teamId: e.target.value })}
        >
          <option value="">— Aucune —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </SelectField>

        <div className="block mb-4">
          <span className="block text-[12px] font-semibold text-lias-ink-soft mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <Users2 size={12} />
              Auteurs <span className="text-lias-danger-text">*</span>
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
                    checked={form.authorMemberIds.includes(m.id)}
                    onChange={() => toggleAuthor(m.id)}
                    className="accent-lias-blue"
                  />
                  {m.firstName} {m.lastName}
                </label>
              ))
            )}
          </div>
          <span className="block text-[11.5px] text-lias-muted mt-1.5">
            L'ordre de sélection détermine l'ordre des auteurs.
          </span>
        </div>

        <FileField
          label="Document PDF"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
          hint="Optionnel — déposez le texte intégral de la publication."
        />

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1" loading={saving}>
            {isEdit ? 'Enregistrer' : 'Créer la publication'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
