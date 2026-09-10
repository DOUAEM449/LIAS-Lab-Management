import { useCallback, useEffect, useState } from 'react';
import { Undo2, PackageCheck, UserX, Send } from 'lucide-react';
import Modal from './Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Alert, EmptyState, LoadingBlock } from './ui/Feedback';
import { Tabs } from './ui/Layout';
import { TextField, SelectField, FieldRow } from './FormField';
import {
  listDistributions,
  listNonRecipients,
  distributeEquipment,
  returnDistribution,
} from '../services/equipmentService';
import { searchMembers } from '../services/memberService';

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/**
 * Distribution register for one equipment item (CdC §2.14).
 *
 * Covers the three questions the cahier des charges asks of this module:
 * who received what, who has NOT received it, and the complete history —
 * including returns, which put the quantity back into the available stock.
 */
export default function EquipmentDistributionModal({ equipment, canDistribute, onClose, onChanged, toast }) {
  const [tab, setTab] = useState('recipients');

  const [distributions, setDistributions] = useState([]);
  const [nonRecipients, setNonRecipients] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ memberId: '', quantity: 1, distributionDate: '' });
  const [distributing, setDistributing] = useState(false);
  const [returningId, setReturningId] = useState(null);

  const load = useCallback(() => {
    if (!equipment) return;
    setLoading(true);
    setError(null);
    Promise.all([listDistributions(equipment.id), listNonRecipients(equipment.id)])
      .then(([dist, non]) => {
        setDistributions(dist);
        setNonRecipients(non);
      })
      .catch((err) => setError(friendlyError(err, 'Échec du chargement du registre de distribution')))
      .finally(() => setLoading(false));
  }, [equipment]);

  useEffect(() => {
    if (!equipment) return;
    setTab('recipients');
    setForm({ memberId: '', quantity: 1, distributionDate: new Date().toISOString().slice(0, 10) });
    load();
    if (canDistribute) {
      searchMembers({ page: 0, size: 200, sort: 'lastName,asc' })
        .then((res) => setMembers(res.content))
        .catch(() => setMembers([]));
    }
  }, [equipment, canDistribute, load]);

  async function handleDistribute(e) {
    e.preventDefault();
    if (!form.memberId) return;
    setDistributing(true);
    try {
      await distributeEquipment(equipment.id, {
        memberId: form.memberId,
        quantity: Number(form.quantity),
        distributionDate: form.distributionDate || undefined,
      });
      toast?.success('Matériel attribué — le stock disponible a été mis à jour.');
      setForm((f) => ({ ...f, memberId: '', quantity: 1 }));
      load();
      onChanged?.();
    } catch (err) {
      toast?.error(friendlyError(err, "Échec de l'attribution"));
    } finally {
      setDistributing(false);
    }
  }

  async function handleReturn(distribution) {
    setReturningId(distribution.id);
    try {
      await returnDistribution(distribution.id);
      toast?.success('Retour enregistré — la quantité est de nouveau disponible.');
      load();
      onChanged?.();
    } catch (err) {
      toast?.error(friendlyError(err, 'Échec de l\'enregistrement du retour'));
    } finally {
      setReturningId(null);
    }
  }

  const active = distributions.filter((d) => !d.returnedDate);
  const returned = distributions.filter((d) => d.returnedDate);

  return (
    <Modal
      open={Boolean(equipment)}
      onClose={onClose}
      title="Registre de distribution"
      subtitle={equipment ? `${equipment.name} — ${equipment.availableQuantity} disponible(s) sur ${equipment.quantity}` : undefined}
      maxWidth="max-w-2xl"
    >
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {canDistribute && (
        <form onSubmit={handleDistribute} className="bg-lias-surface-muted/60 border border-lias-border-light rounded-lg p-4 mb-5">
          <div className="text-[13px] font-semibold text-lias-navy mb-3 flex items-center gap-2">
            <Send size={14} className="text-lias-blue-dark" />
            Attribuer ce matériel à un membre
          </div>
          <FieldRow className="sm:grid-cols-3">
            <SelectField
              label="Bénéficiaire"
              required
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            >
              <option value="">— Sélectionner —</option>
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
              max={equipment?.availableQuantity || 1}
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <TextField
              label="Date de remise"
              type="date"
              value={form.distributionDate}
              onChange={(e) => setForm({ ...form, distributionDate: e.target.value })}
            />
          </FieldRow>
          <Button
            type="submit"
            size="sm"
            icon={PackageCheck}
            loading={distributing}
            disabled={!form.memberId || equipment?.availableQuantity === 0}
          >
            Attribuer
          </Button>
          {equipment?.availableQuantity === 0 && (
            <span className="ml-3 text-[12px] text-lias-warning-text">Stock épuisé.</span>
          )}
        </form>
      )}

      <Tabs
        tabs={[
          { key: 'recipients', label: 'Bénéficiaires', count: active.length },
          { key: 'returned', label: 'Retours', count: returned.length },
          { key: 'non-recipients', label: 'Non-bénéficiaires', count: nonRecipients.length },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-4"
      />

      {loading ? (
        <LoadingBlock label="Chargement du registre..." />
      ) : (
        <>
          {tab === 'recipients' &&
            (active.length === 0 ? (
              <EmptyState
                icon={PackageCheck}
                title="Aucune attribution en cours"
                description="Ce matériel n'est actuellement remis à aucun membre."
                className="py-10"
              />
            ) : (
              <ul className="list-none p-0 m-0">
                {active.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-4 py-3 border-b border-lias-border-light last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-lias-ink">{d.memberName}</div>
                      <div className="text-[11.5px] text-lias-muted font-mono mt-0.5">
                        {d.quantity} unité(s) — remis le {new Date(d.distributionDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    {canDistribute && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Undo2}
                        loading={returningId === d.id}
                        onClick={() => handleReturn(d)}
                      >
                        Retour
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'returned' &&
            (returned.length === 0 ? (
              <EmptyState icon={Undo2} title="Aucun retour enregistré" className="py-10" />
            ) : (
              <ul className="list-none p-0 m-0">
                {returned.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-4 py-3 border-b border-lias-border-light last:border-b-0">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-lias-ink">{d.memberName}</div>
                      <div className="text-[11.5px] text-lias-muted font-mono mt-0.5">
                        {d.quantity} unité(s) — {new Date(d.distributionDate).toLocaleDateString('fr-FR')} →{' '}
                        {new Date(d.returnedDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <Badge tone="neutral" size="sm">
                      Restitué
                    </Badge>
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'non-recipients' &&
            (nonRecipients.length === 0 ? (
              <EmptyState
                icon={UserX}
                title="Tous les membres actifs ont reçu ce matériel"
                description="La distribution couvre l'ensemble des membres actifs du laboratoire."
                className="py-10"
              />
            ) : (
              <>
                <p className="text-[12.5px] text-lias-muted mt-0 mb-3">
                  Membres actifs n'ayant jamais reçu ce matériel — utile pour assurer une distribution
                  équitable (CdC §2.14).
                </p>
                <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  {nonRecipients.map((m) => (
                    <li key={m.memberId} className="py-2.5 text-[13px] text-lias-ink border-b border-lias-border-light">
                      {m.fullName}
                    </li>
                  ))}
                </ul>
              </>
            ))}
        </>
      )}
    </Modal>
  );
}
