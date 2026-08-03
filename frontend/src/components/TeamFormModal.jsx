import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { TextField, TextAreaField } from './FormField';
import { createTeam, updateTeam } from '../services/governanceService';

const EMPTY_FORM = { name: '', description: '', creationDate: '' };

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function TeamFormModal({ open, team, onClose, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(team);

  useEffect(() => {
    if (!open) return;
    setForm(
      team
        ? { name: team.name ?? '', description: team.description ?? '', creationDate: team.creationDate ?? '' }
        : EMPTY_FORM
    );
  }, [open, team]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        creationDate: form.creationDate || undefined,
      };
      const saved = isEdit ? await updateTeam(team.id, payload) : await createTeam(payload);
      toast.success(isEdit ? 'Équipe mise à jour.' : 'Équipe créée.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'enregistrement de l'équipe"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Modifier l'équipe" : 'Nouvelle équipe'}>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nom de l'équipe"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <TextAreaField
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <TextField
          label="Date de création"
          type="date"
          value={form.creationDate}
          onChange={(e) => setForm({ ...form, creationDate: e.target.value })}
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Enregistrer' : "Créer l'équipe"}
        </button>
      </form>
    </Modal>
  );
}
