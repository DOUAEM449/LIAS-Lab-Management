import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { TextField, TextAreaField, SelectField, FileField } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import { submitMembershipRequest } from '../services/membershipRequestService';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  requestedStatus: 'PHD_STUDENT',
  homeInstitution: '',
  motivationLetter: '',
};

function friendlyError(err, fallback) {
  return err.response?.data?.message || fallback;
}

export default function PublicApplyPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [cvFile, setCvFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState(null);
  const toast = useToasts();

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await submitMembershipRequest(form, cvFile);
      setSubmitted(true);
      toast.success('Votre demande a bien été envoyée.');
    } catch (err) {
      const message = friendlyError(err, "Échec de l'envoi de votre demande. Veuillez réessayer.");
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-lias-bg px-4 py-14 min-h-[70vh]">
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />
      <div className="max-w-lg mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-lias-muted no-underline hover:text-lias-ink mb-5"
        >
          <ArrowLeft size={15} />
          Retour à l'accueil
        </Link>

        {submitted ? (
          <div className="bg-white border border-lias-border rounded-xl p-8 text-center">
            <CheckCircle2 size={40} className="text-lias-success mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-lias-navy mb-2">Demande envoyée</h1>
            <p className="text-sm text-lias-muted">
              Votre demande d'adhésion au laboratoire LIAS a bien été transmise. Le directeur du
              laboratoire l'examinera prochainement et vous serez notifié(e) par email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-lias-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-lias-blue flex items-center justify-center">
                <span className="text-white font-bold text-[15px] font-mono">L</span>
              </div>
              <div>
                <div className="font-semibold text-lias-navy">LIAS</div>
                <div className="text-[11px] text-lias-muted">Demande d'adhésion</div>
              </div>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-3 py-2.5">
                <AlertCircle size={15} />
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-4">
              <TextField
                label="Prénom"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <TextField
                label="Nom"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <TextField
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <SelectField
              label="Statut souhaité"
              value={form.requestedStatus}
              onChange={(e) => setForm({ ...form, requestedStatus: e.target.value })}
            >
              <option value="PHD_STUDENT">Doctorant</option>
              <option value="ASSOCIATE">Membre associé</option>
              <option value="PERMANENT">Membre permanent</option>
            </SelectField>
            <TextField
              label="Établissement d'origine"
              value={form.homeInstitution}
              onChange={(e) => setForm({ ...form, homeInstitution: e.target.value })}
            />
            <TextAreaField
              label="Lettre de motivation"
              required
              rows={4}
              value={form.motivationLetter}
              onChange={(e) => setForm({ ...form, motivationLetter: e.target.value })}
            />
            <FileField
              label="CV (optionnel)"
              accept="application/pdf"
              onChange={(e) => setCvFile(e.target.files[0])}
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Envoyer ma candidature
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
