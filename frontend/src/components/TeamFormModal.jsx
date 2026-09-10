import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './ui/Button';
import { TextField, TextAreaField } from './FormField';
import { createTeam, updateTeam } from '../services/governanceService';

const EMPTY_FORM = { name: '', description: '', creationDate: '' };

function friendlyError(err, fallback) {
  if (err.response?.status === 409) return 'Une équipe portant ce nom existe déjà.';
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
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier l'équipe" : 'Nouvelle équipe de recherche'}
      subtitle="Le responsable de l'équipe se désigne par un mandat, depuis l'onglet Mandats."
    >
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nom de l'équipe"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex. Systèmes Intelligents & Données"
        />
        <TextAreaField
          label="Description scientifique"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Thématiques de recherche, positionnement, projets phares..."
          hint="Ce texte est affiché sur le portail public du laboratoire."
        />
        <TextField
          label="Date de création"
          type="date"
          value={form.creationDate}
          onChange={(e) => setForm({ ...form, creationDate: e.target.value })}
        />

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1" loading={saving}>
            {isEdit ? 'Enregistrer' : "Créer l'équipe"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
