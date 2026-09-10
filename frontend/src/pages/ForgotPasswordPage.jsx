import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, Send } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import Button from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { TextField } from '../components/FormField';
import { forgotPassword } from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de l'envoi. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Mot de passe oublié" subtitle="Réinitialisation d'accès">
      {sent ? (
        <div className="text-center py-2 lias-enter">
          <div className="w-14 h-14 rounded-full bg-lias-success-bg flex items-center justify-center mx-auto mb-5">
            <MailCheck size={26} className="text-lias-success-text" />
          </div>
          <p className="text-[13.5px] text-lias-ink leading-relaxed m-0">
            Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient de lui
            être envoyé. Vérifiez votre boîte de réception — le lien est valable une heure.
          </p>
          <Link to="/login" className="no-underline inline-block mt-6">
            <Button variant="secondary" className="w-full">
              Revenir à la connexion
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-[13px] text-lias-muted mt-0 mb-5 leading-relaxed">
            Saisissez l'adresse email associée à votre compte. Nous vous enverrons un lien
            sécurisé pour définir un nouveau mot de passe.
          </p>

          {error && (
            <Alert tone="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <TextField
            label="Adresse email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@lias.ma"
          />

          <Button type="submit" icon={Send} className="w-full" loading={loading}>
            Envoyer le lien de réinitialisation
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
