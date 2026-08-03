import { useEffect, useState } from 'react';
import { Loader2, Upload, FileText, Trash2, Plus } from 'lucide-react';
import Modal from './Modal';
import { TextField, FileField } from './FormField';
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

export default function PartnerFormModal({ open, partner, onClose, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  const [agreements, setAgreements] = useState([]);
  const [agreementForm, setAgreementForm] = useState(EMPTY_AGREEMENT);
  const [addingAgreement, setAddingAgreement] = useState(false);
  const [agreementDocFiles, setAgreementDocFiles] = useState({});

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
      toast.success(isEdit ? 'Partenaire mis à jour.' : 'Partenaire créé.');
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
      const refreshed = await listAgreementsByPartner(partner.id);
      setAgreements(refreshed);
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
      toast.success('Convention supprimée.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec de la suppression'));
    }
  }

  async function handleUploadAgreementDoc(agreementId) {
    const file = agreementDocFiles[agreementId];
    if (!file) return;
    try {
      await uploadAgreementDocument(agreementId, file);
      const refreshed = await listAgreementsByPartner(partner.id);
      setAgreements(refreshed);
      setAgreementDocFiles((prev) => ({ ...prev, [agreementId]: null }));
      toast.success('Document téléversé.');
    } catch (err) {
      toast.error(friendlyError(err, 'Échec du téléversement'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={isEdit ? 'Modifier le partenaire' : 'Nouveau partenaire'}
    >
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nom"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-x-4">
          <TextField
            label="Type"
            placeholder="Industriel, académique..."
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <TextField
            label="Pays"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </div>
        <TextField
          label="Contact"
          value={form.contactInfo}
          onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
        />
        <FileField label="Logo" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Enregistrer' : 'Créer le partenaire'}
        </button>
      </form>

      {isEdit && (
        <div className="border-t border-lias-border-light mt-5 pt-4">
          <div className="text-xs font-semibold text-lias-muted uppercase tracking-wide mb-3">
            Conventions & accords
          </div>

          {agreements.length > 0 && (
            <ul className="list-none p-0 m-0 mb-4 space-y-3">
              {agreements.map((a) => (
                <li key={a.id} className="border border-lias-border-light rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-lias-ink">{a.title}</div>
                      {(a.startDate || a.endDate) && (
                        <div className="text-xs text-lias-muted mt-0.5">
                          {a.startDate || '?'} → {a.endDate || 'en cours'}
                        </div>
                      )}
                      {a.documentOriginalName ? (
                        <div className="flex items-center gap-1.5 text-xs text-lias-ink mt-1">
                          <FileText size={12} /> {a.documentOriginalName}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="file"
                            onChange={(e) =>
                              setAgreementDocFiles((prev) => ({ ...prev, [a.id]: e.target.files[0] }))
                            }
                            className="text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleUploadAgreementDoc(a.id)}
                            className="text-xs bg-white border border-lias-border rounded px-2 py-1 cursor-pointer flex items-center gap-1"
                          >
                            <Upload size={11} /> Téléverser
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAgreement(a.id)}
                      className="text-rose-600 bg-transparent border-none cursor-pointer p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddAgreement} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <TextField
              label="Titre de la convention"
              value={agreementForm.title}
              onChange={(e) => setAgreementForm({ ...agreementForm, title: e.target.value })}
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
            <button
              type="submit"
              disabled={addingAgreement || !agreementForm.title}
              className="col-span-full bg-white border border-lias-border text-lias-ink rounded-lg py-2 text-sm font-medium cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addingAgreement ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajouter la convention
            </button>
          </form>
        </div>
      )}
    </Modal>
  );
}
