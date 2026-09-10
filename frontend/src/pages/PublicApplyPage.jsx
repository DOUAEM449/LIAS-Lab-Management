import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, UserPlus, Mail, ShieldCheck, Send } from 'lucide-react';
import { TextField, TextAreaField, SelectField, FileField, FieldRow } from '../components/FormField';
import { ToastStack, useToasts } from '../components/Toast';
import Button from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { submitMembershipRequest } from '../services/membershipRequestService';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  requestedStatus: 'PHD_STUDENT',
  homeInstitution: '',
  motivationLetter: '',
};

const STEPS = [
  { icon: Send, title: 'Vous déposez votre candidature', text: 'Formulaire, CV et lettre de motivation.' },
  { icon: ShieldCheck, title: 'La direction examine le dossier', text: 'Le directeur en mandat statue sur la demande.' },
  { icon: Mail, title: 'Vous recevez la décision', text: 'En cas d\'acceptation, votre compte est créé automatiquement.' },
];

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const message = friendlyError(err, "Échec de l'envoi de votre demande. Veuillez réessayer.");
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      {/* ----------------------------- Hero ----------------------------- */}
      <section className="relative overflow-hidden bg-lias-navy">
        <div
          className="absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-6">
            <UserPlus size={24} className="text-white" />
          </div>
          <h1 className="text-white text-[30px] sm:text-[36px] font-bold tracking-[-0.02em] m-0 leading-tight">
            Rejoindre le laboratoire LIAS
          </h1>
          <p className="text-white/65 text-[15px] mt-4 max-w-xl mx-auto leading-relaxed">
            Déposez votre candidature pour intégrer nos équipes de recherche en informatique,
            systèmes distribués et automatique.
          </p>
        </div>
      </section>

      {/* ---------------------------- Steps ---------------------------- */}
      <section className="px-5 sm:px-8 py-12 bg-lias-bg border-b border-lias-border">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-lias-surface border border-lias-border flex items-center justify-center shrink-0">
                <s.icon size={16} className="text-lias-blue-dark" />
              </div>
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-lias-faint mb-1">
                  Étape {i + 1}
                </div>
                <div className="text-[13.5px] font-semibold text-lias-navy leading-snug">{s.title}</div>
                <p className="text-[12.5px] text-lias-muted mt-1 mb-0 leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------- Form ----------------------------- */}
      <section className="px-5 sm:px-8 py-14">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-lias-muted no-underline
              hover:text-lias-ink mb-6 transition-colors duration-150"
          >
            <ArrowLeft size={15} />
            Retour à l'accueil
          </Link>

          {submitted ? (
            <div className="bg-lias-surface border border-lias-border rounded-card shadow-raised p-10 sm:p-12 text-center lias-enter">
              <div className="w-16 h-16 rounded-full bg-lias-success-bg flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={30} className="text-lias-success-text" />
              </div>
              <h2 className="text-[19px] font-bold text-lias-navy m-0 mb-3">Candidature transmise</h2>
              <p className="text-[14px] text-lias-muted max-w-md mx-auto leading-relaxed m-0">
                Votre demande d'adhésion au laboratoire LIAS a bien été enregistrée. La direction
                du laboratoire l'examinera prochainement, et vous serez informé(e) de la décision
                par email à l'adresse <strong className="text-lias-ink">{form.email}</strong>.
              </p>
              <Link to="/" className="no-underline inline-block mt-8">
                <Button variant="secondary">Revenir au site du laboratoire</Button>
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-lias-surface border border-lias-border rounded-card shadow-raised p-7 sm:p-9"
            >
              {formError && (
                <Alert tone="danger" className="mb-6">
                  {formError}
                </Alert>
              )}

              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lias-faint mb-4">
                Informations personnelles
              </div>
              <FieldRow>
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
                <TextField
                  label="Adresse email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  hint="C'est à cette adresse que la décision vous sera transmise."
                />
                <TextField
                  label="Établissement d'origine"
                  value={form.homeInstitution}
                  onChange={(e) => setForm({ ...form, homeInstitution: e.target.value })}
                  placeholder="Université, école, entreprise..."
                />
              </FieldRow>

              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lias-faint mb-4 mt-4 pt-5 border-t border-lias-border-light">
                Votre candidature
              </div>
              <FieldRow>
                <SelectField
                  label="Statut souhaité"
                  required
                  value={form.requestedStatus}
                  onChange={(e) => setForm({ ...form, requestedStatus: e.target.value })}
                >
                  <option value="PHD_STUDENT">Doctorant</option>
                  <option value="ASSOCIATE">Membre associé</option>
                  <option value="PERMANENT">Membre permanent</option>
                </SelectField>
                <FileField
                  label="Curriculum vitae"
                  accept="application/pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                  hint="Format PDF, optionnel mais recommandé."
                />
              </FieldRow>

              <TextAreaField
                label="Lettre de motivation"
                required
                rows={6}
                value={form.motivationLetter}
                onChange={(e) => setForm({ ...form, motivationLetter: e.target.value })}
                placeholder="Présentez votre parcours, vos thématiques de recherche et vos motivations pour rejoindre le LIAS."
              />

              <Button type="submit" size="lg" icon={Send} className="w-full mt-2" loading={submitting}>
                Envoyer ma candidature
              </Button>

              <p className="text-[11.5px] text-lias-muted text-center mt-5 mb-0">
                Vous êtes déjà membre ?{' '}
                <Link to="/login" className="text-lias-blue-dark font-medium no-underline hover:underline">
                  Accéder à l'espace membres
                </Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
