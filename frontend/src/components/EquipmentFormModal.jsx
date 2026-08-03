import { useEffect, useState } from 'react';
import { Loader2, PackageCheck, Undo2 } from 'lucide-react';
import Modal from './Modal';
import { TextField, TextAreaField, SelectField } from './FormField';
import {
  createEquipment,
  updateEquipment,
  listDistributions,
  distributeEquipment,
  returnDistribution,
} from '../services/equipmentService';
import { searchMembers } from '../services/memberService';

const EMPTY_FORM = { name: '', description: '', category: '', arrivalDate: '', quantity: 1 };
const EMPTY_DIST = { memberId: '', quantity: 1, distributionDate: '' };

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

export default function EquipmentFormModal({ open, equipment, onClose, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(equipment);

  const [members, setMembers] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [distForm, setDistForm] = useState(EMPTY_DIST);
  const [distributing, setDistributing] = useState(false);
  const [returningId, setReturningId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      equipment
        ? {
            name: equipment.name ?? '',
            description: equipment.description ?? '',
            category: equipment.category ?? '',
            arrivalDate: equipment.arrivalDate ?? '',
            quantity: equipment.quantity ?? 1,
          }
        : EMPTY_FORM
    );
    setDistForm(EMPTY_DIST);
    setDistributions([]);
    if (equipment) {
      listDistributions(equipment.id)
        .then(setDistributions)
        .catch(() => {});
      searchMembers({ page: 0, size: 200, sort: 'lastName,asc' })
        .then((res) => setMembers(res.content))
        .catch(() => {});
    }
  }, [open, equipment]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        arrivalDate: form.arrivalDate || undefined,
        quantity: Number(form.quantity),
      };
      const saved = isEdit ? await updateEquipment(equipment.id, payload) : await createEquipment(payload);
      toast.success(isEdit ? 'Matériel mis à jour.' : 'Matériel ajouté.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'enregistrement du matériel"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDistribute(e) {
    e.preventDefault();
    if (!distForm.memberId) return;
    setDistributing(true);
    try {
      await distributeEquipment(equipment.id, {
        memberId: distForm.memberId,
        quantity: Number(distForm.quantity),
        distributionDate: distForm.distributionDate || undefined,
      });
      const refreshed = await listDistributions(equipment.id);
      setDistributions(refreshed);
      setDistForm(EMPTY_DIST);
      toast.success('Matériel distribué.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la distribution'));
    } finally {
      setDistributing(false);
    }
  }

  async function handleReturn(distributionId) {
    setReturningId(distributionId);
    try {
      await returnDistribution(distributionId);
      const refreshed = await listDistributions(equipment.id);
      setDistributions(refreshed);
      toast.success('Retour enregistré.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de l’enregistrement du retour'));
    } finally {
      setReturningId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-xl" title={isEdit ? 'Modifier le matériel' : 'Nouveau matériel'}>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nom"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-x-4">
          <TextField
            label="Catégorie"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <TextField
            label="Date d'arrivée"
            type="date"
            value={form.arrivalDate}
            onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
          />
        </div>
        <TextField
          label="Quantité totale"
          type="number"
          min={0}
          required
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
        />
        <TextAreaField
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Enregistrer' : 'Ajouter au stock'}
        </button>
      </form>

      {isEdit && (
        <div className="border-t border-lias-border-light mt-5 pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-lias-muted uppercase tracking-wide mb-3">
            <PackageCheck size={14} />
            Distribution ({equipment.availableQuantity} / {equipment.quantity} disponible)
          </div>

          {distributions.length > 0 && (
            <ul className="list-none p-0 m-0 mb-4 space-y-1.5">
              {distributions.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm text-lias-ink">
                  <span>
                    {d.memberName} — {d.quantity} unité(s) le {d.distributionDate}
                    {d.returnedDate && (
                      <span className="text-lias-muted"> (rendu le {d.returnedDate})</span>
                    )}
                  </span>
                  {!d.returnedDate && (
                    <button
                      type="button"
                      onClick={() => handleReturn(d.id)}
                      disabled={returningId === d.id}
                      className="flex items-center gap-1 text-xs bg-white border border-lias-border rounded px-2 py-1 cursor-pointer disabled:opacity-50"
                    >
                      {returningId === d.id ? <Loader2 size={11} className="animate-spin" /> : <Undo2 size={11} />}
                      Retour
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleDistribute} className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 items-end">
            <SelectField
              label="Membre"
              value={distForm.memberId}
              onChange={(e) => setDistForm({ ...distForm, memberId: e.target.value })}
            >
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </SelectField>
            <TextField
              label="Quantité"
              type="number"
              min={1}
              value={distForm.quantity}
              onChange={(e) => setDistForm({ ...distForm, quantity: e.target.value })}
            />
            <button
              type="submit"
              disabled={distributing || !distForm.memberId}
              className="bg-white border border-lias-border text-lias-ink rounded-lg py-2.5 text-sm font-medium cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mb-3.5"
            >
              {distributing && <Loader2 size={14} className="animate-spin" />}
              Distribuer
            </button>
          </form>
        </div>
      )}
    </Modal>
  );
}
