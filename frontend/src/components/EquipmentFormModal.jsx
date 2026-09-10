import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './ui/Button';
import { TextField, TextAreaField, FieldRow } from './FormField';
import { createEquipment, updateEquipment } from '../services/equipmentService';

const EMPTY_FORM = { name: '', description: '', category: '', arrivalDate: '', quantity: 1 };

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/**
 * Create / edit an inventory item. Distribution, returns and the recipient /
 * non-recipient registers live in EquipmentDistributionModal — this modal owns
 * the item definition only.
 */
export default function EquipmentFormModal({ open, equipment, onClose, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(equipment);

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
      toast.success(isEdit ? 'Matériel mis à jour.' : 'Matériel enregistré dans l\'inventaire.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'enregistrement du matériel"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={isEdit ? 'Modifier le matériel' : 'Enregistrer un arrivage'}
      subtitle={
        isEdit
          ? 'La distribution se gère depuis le registre de distribution.'
          : "Nouvel équipement entrant dans l'inventaire du laboratoire"
      }
    >
      <form onSubmit={handleSubmit}>
        <TextField
          label="Désignation"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex. Ordinateur portable Dell Latitude"
        />
        <TextAreaField
          label="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Caractéristiques, référence, numéro de série..."
        />
        <FieldRow>
          <TextField
            label="Catégorie"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Informatique, mobilier, instrument..."
          />
          <TextField
            label="Date d'arrivage"
            type="date"
            value={form.arrivalDate}
            onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
          />
        </FieldRow>
        <TextField
          label="Quantité totale"
          type="number"
          min={0}
          required
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          hint={
            isEdit
              ? 'Modifier ce total ajuste automatiquement la quantité disponible du même écart.'
              : "Quantité reçue ; l'intégralité est disponible à la distribution."
          }
        />

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1" loading={saving}>
            {isEdit ? 'Enregistrer' : 'Ajouter à l\'inventaire'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
