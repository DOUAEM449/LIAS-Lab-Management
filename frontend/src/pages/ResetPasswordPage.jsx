import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import Button from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { TextField } from '../components/FormField';
import { resetPassword } from '../services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Lien invalide : le jeton de réinitialisation est manquant.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Lien invalide ou expiré. Demandez un nouveau lien.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Réinitialisation d'accès">
      {done ? (
        <div className="text-center py-2 lias-enter">
          <div className="w-14 h-14 rounded-full bg-lias-success-bg flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={26} className="text-lias-success-text" />
          </div>
          <p className="text-[13.5px] text-lias-ink leading-relaxed m-0">
            Votre mot de passe a été réinitialisé. Redirection vers la page de connexion…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {!token && (
            <Alert tone="danger" className="mb-4">
              Lien invalide : aucun jeton trouvé dans l'URL.{' '}
              <Link to="/forgot-password" className="underline text-inherit">
                Demander un nouveau lien
              </Link>
              .
            </Alert>
          )}
          {error && (
            <Alert tone="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <p className="text-[13px] text-lias-muted mt-0 mb-5 leading-relaxed">
            Choisissez un nouveau mot de passe pour votre compte LIAS.
          </p>

          <TextField
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            hint="8 caractères minimum."
          />
          <TextField
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button type="submit" icon={KeyRound} className="w-full" loading={loading} disabled={!token}>
            Réinitialiser le mot de passe
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
