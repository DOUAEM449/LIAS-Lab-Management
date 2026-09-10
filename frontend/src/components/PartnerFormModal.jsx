import { useEffect, useState } from 'react';
import { Upload, FileText, Trash2, Plus, FileSignature } from 'lucide-react';
import Modal from './Modal';
import Button, { IconButton } from './ui/Button';
import Badge from './ui/Badge';
import { TextField, TextAreaField, FileField, FieldRow } from './FormField';
import {
  createPartner,
  updatePartner,
  uploadPartnerLogo,
  listAgreementsByPartner,
  createAgreement,
  deleteAgreement,
  uploadAgreementDocument,
} from '../services/partnershipService';

const EMPTY_FORM = { name: '', type: '', country: '', contactInfo: '' };
const EMPTY_AGREEMENT = { title: '', description: '', startDate: '', endDate: '' };

function friendlyError(err, fallback) {
  if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  return err.response?.data?.message || fallback;
}

/** Partner record plus its conventions and archived contractual documents (CdC §2.16). */
export default function PartnerFormModal({ open, partner, onClose, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  const [agreements, setAgreements] = useState([]);
  const [agreementForm, setAgreementForm] = useState(EMPTY_AGREEMENT);
  const [addingAgreement, setAddingAgreement] = useState(false);
  const [agreementDocFiles, setAgreementDocFiles] = useState({});
  const [uploadingDocId, setUploadingDocId] = useState(null);

  const isEdit = Boolean(partner);

  useEffect(() => {
    if (!open) return;
    setForm(
      partner
        ? {
            name: partner.name ?? '',
            type: partner.type ?? '',
            country: partner.country ?? '',
            contactInfo: partner.contactInfo ?? '',
          }
        : EMPTY_FORM
    );
    setLogoFile(null);
    setAgreementForm(EMPTY_AGREEMENT);
    setAgreements([]);
    if (partner) {
      listAgreementsByPartner(partner.id)
        .then(setAgreements)
        .catch(() => {});
    }
  }, [open, partner]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type || undefined,
        country: form.country || undefined,
        contactInfo: form.contactInfo || undefined,
      };
      let saved = isEdit ? await updatePartner(partner.id, payload) : await createPartner(payload);
      if (logoFile) {
        saved = await uploadPartnerLogo(saved.id, logoFile);
      }
      toast.success(isEdit ? 'Partenaire mis à jour.' : 'Partenaire enregistré.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'enregistrement du partenaire"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAgreement(e) {
    e.preventDefault();
    if (!agreementForm.title || !partner) return;
    setAddingAgreement(true);
    try {
      await createAgreement({
        partnerId: partner.id,
        title: agreementForm.title,
        description: agreementForm.description || undefined,
        startDate: agreementForm.startDate || undefined,
        endDate: agreementForm.endDate || undefined,
      });
      setAgreements(await listAgreementsByPartner(partner.id));
      setAgreementForm(EMPTY_AGREEMENT);
      toast.success('Convention ajoutée.');
    } catch (err) {
      toast.error(friendlyError(err, "Échec de l'ajout de la convention"));
    } finally {
      setAddingAgreement(false);
    }
  }

  async function handleDeleteAgreement(agreementId) {
    try {
      await deleteAgreement(agreementId);
      setAgreements((prev) => prev.filter((a) => a.id !== agreementId));
      toast.success('Convention archivée.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la suppression'));
    }
  }

  async function handleUploadAgreementDoc(agreementId) {
    const file = agreementDocFiles[agreementId];
    if (!file) return;
    setUploadingDocId(agreementId);
    try {
      await uploadAgreementDocument(agreementId, file);
      setAgreements(await listAgreementsByPartner(partner.id));
      setAgreementDocFiles((prev) => ({ ...prev, [agreementId]: null }));
      toast.success('Document contractuel archivé.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du téléversement'));
    } finally {
      setUploadingDocId(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={isEdit ? 'Fiche du partenaire' : 'Nouveau partenaire'}
      subtitle={isEdit ? 'Coordonnées, conventions et documents contractuels' : 'Collaboration académique ou industrielle'}
    >
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nom du partenaire"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Université, entreprise, institution..."
        />
        <FieldRow>
          <TextField
            label="Type de partenaire"
            placeholder="Académique, industriel, institutionnel..."
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <TextField
            label="Pays"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </FieldRow>
        <TextAreaField
          label="Coordonnées de contact"
          rows={2}
          value={form.contactInfo}
          onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
          placeholder="Personne référente, email, téléphone..."
        />
        <FileField
          label="Logo du partenaire"
          accept="image/*"
          onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
        />

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Fermer
          </Button>
          <Button type="submit" className="flex-1" loading={saving}>
            {isEdit ? 'Enregistrer' : 'Créer le partenaire'}
          </Button>
        </div>
      </form>

      {isEdit && (
        <div className="border-t border-lias-border-light mt-6 pt-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint flex items-center gap-1.5">
              <FileSignature size={12} />
              Conventions & accords
            </span>
            <Badge tone={agreements.length > 0 ? 'success' : 'neutral'} size="sm">
              {agreements.length}
            </Badge>
          </div>

          {agreements.length > 0 && (
            <ul className="list-none p-0 m-0 mb-5 flex flex-col gap-2.5">
              {agreements.map((a) => (
                <li key={a.id} className="border border-lias-border-light rounded-lg p-3.5 bg-lias-surface-muted/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-lias-ink">{a.title}</div>
                      {a.description && (
                        <p className="text-[12px] text-lias-muted mt-1 mb-0 leading-snug">{a.description}</p>
                      )}
                      {(a.startDate || a.endDate) && (
                        <div className="text-[11.5px] text-lias-faint font-mono mt-1.5">
                          {a.startDate || '?'} → {a.endDate || 'en cours'}
                        </div>
                      )}

                      {a.documentOriginalName ? (
                        <div className="flex items-center gap-1.5 text-[12px] text-lias-ink mt-2.5">
                          <FileText size={12} className="text-lias-faint" />
                          {a.documentOriginalName}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-3">
                          <input
                            type="file"
                            onChange={(e) =>
                              setAgreementDocFiles((prev) => ({ ...prev, [a.id]: e.target.files?.[0] ?? null }))
                            }
                            className="text-[11.5px] max-w-[190px]
                              file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px]
                              file:font-semibold file:bg-lias-blue-tint-solid file:text-lias-blue-dark file:cursor-pointer"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={Upload}
                            disabled={!agreementDocFiles[a.id]}
                            loading={uploadingDocId === a.id}
                            onClick={() => handleUploadAgreementDoc(a.id)}
                          >
                            Archiver
                          </Button>
                        </div>
                      )}
                    </div>
                    <IconButton
                      icon={Trash2}
                      label="Archiver la convention"
                      variant="danger"
                      onClick={() => handleDeleteAgreement(a.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddAgreement}>
            <FieldRow>
              <TextField
                label="Titre de la convention"
                value={agreementForm.title}
                onChange={(e) => setAgreementForm({ ...agreementForm, title: e.target.value })}
                placeholder="Ex. Accord-cadre de recherche"
              />
              <TextField
                label="Description"
                value={agreementForm.description}
                onChange={(e) => setAgreementForm({ ...agreementForm, description: e.target.value })}
              />
              <TextField
                label="Date de début"
                type="date"
                value={agreementForm.startDate}
                onChange={(e) => setAgreementForm({ ...agreementForm, startDate: e.target.value })}
              />
              <TextField
                label="Date de fin"
                type="date"
                value={agreementForm.endDate}
                onChange={(e) => setAgreementForm({ ...agreementForm, endDate: e.target.value })}
              />
            </FieldRow>
            <Button
              type="submit"
              variant="secondary"
              icon={Plus}
              className="w-full"
              loading={addingAgreement}
              disabled={!agreementForm.title}
            >
              Ajouter la convention
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
}
