import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Building2, ShieldCheck, Archive, Eye, EyeOff } from 'lucide-react';
import { login } from '../services/authService';
import Button from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Gouvernance tracée',
    text: "Mandats datés, rôles dérivés, historique complet des responsabilités du laboratoire.",
  },
  {
    icon: Archive,
    title: 'Mémoire institutionnelle',
    text: 'Aucune donnée supprimée : statuts, affiliations, documents et décisions restent consultables.',
  },
];

export default function LoginPage({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionMessage, setSessionMessage] = useState(null);
  const navigate = useNavigate();

  // Set by services/api.js when a request is rejected with 401 — covers both
  // an expired session and an account frozen/disabled (RETIRED/FORMER) mid-session.
  useEffect(() => {
    const msg = sessionStorage.getItem('lias_session_message');
    if (msg) {
      setSessionMessage(msg);
      sessionStorage.removeItem('lias_session_message');
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onLoggedIn();
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-lias-surface">
      {/* ------------------------- Institutional panel ------------------------- */}
      <aside className="relative hidden lg:flex flex-col justify-between bg-lias-navy overflow-hidden p-12">
        <div
          className="absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
        <div
          className="absolute -bottom-40 -left-24 w-[460px] h-[460px] rounded-full opacity-25 blur-3xl"
          aria-hidden="true"
          style={{ background: 'radial-gradient(circle, oklch(55% 0.09 250), transparent 70%)' }}
        />

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-lg bg-lias-blue flex items-center justify-center">
              <span className="text-white font-bold text-[16px] font-mono">L</span>
            </div>
            <div>
              <div className="text-white font-semibold text-[17px] leading-none tracking-tight">LIAS</div>
              <div className="text-white/50 text-[11px] mt-1">Plateforme du laboratoire</div>
            </div>
          </Link>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60 bg-white/[0.08] border border-white/10 px-3 py-1.5 rounded-full mb-7">
            <Building2 size={12} />
            Faculté des Sciences Ben M'Sik
          </span>
          <h2 className="text-white text-[30px] font-bold leading-[1.15] tracking-[-0.02em] m-0 mb-5">
            Le système d'information du laboratoire de recherche
          </h2>
          <p className="text-white/60 text-[14.5px] leading-relaxed m-0">
            Membres, gouvernance, publications, événements, matériel et archives documentaires —
            centralisés et traçables.
          </p>

          <ul className="list-none p-0 mt-10 flex flex-col gap-5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <h.icon size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-white text-[13.5px] font-semibold">{h.title}</div>
                  <div className="text-white/50 text-[12.5px] mt-1 leading-relaxed">{h.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-white/35 text-[11.5px]">
          © {new Date().getFullYear()} LIAS — Université Hassan II de Casablanca
        </div>
      </aside>

      {/* ------------------------------- Form -------------------------------- */}
      <main className="flex flex-col px-5 sm:px-10 py-8">
        <div className="lg:hidden mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-lias-muted no-underline hover:text-lias-ink"
          >
            <ArrowLeft size={15} />
            Retour au site public
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px]">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-lg bg-lias-navy flex items-center justify-center">
                <span className="text-white font-bold text-[16px] font-mono">L</span>
              </div>
              <div>
                <div className="text-lias-navy font-semibold text-[17px] leading-none">LIAS</div>
                <div className="text-lias-muted text-[11.5px] mt-1">Espace membres</div>
              </div>
            </div>

            <h1 className="text-[24px] font-bold text-lias-navy tracking-[-0.02em] m-0">Connexion</h1>
            <p className="text-[13.5px] text-lias-muted mt-2 mb-8">
              Accédez à votre espace membre et aux modules du laboratoire.
            </p>

            <form onSubmit={handleSubmit}>
              {sessionMessage && (
                <Alert tone="warning" className="mb-4">
                  {sessionMessage}
                </Alert>
              )}
              {error && (
                <Alert tone="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <label className="block text-[12px] font-semibold text-lias-ink-soft mb-1.5" htmlFor="login-email">
                Adresse email
              </label>
              <div className="relative mb-4">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lias-faint" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2.5 border border-lias-border rounded-lg text-[13.5px] outline-none
                    bg-lias-surface hover:border-lias-border-strong focus:border-lias-blue transition-colors duration-150
                    placeholder:text-lias-faint"
                  placeholder="vous@lias.ma"
                />
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-lias-ink-soft" htmlFor="login-password">
                  Mot de passe
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] text-lias-blue-dark no-underline hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative mb-7">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lias-faint" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9.5 pr-10 py-2.5 border border-lias-border rounded-lg text-[13.5px] outline-none
                    bg-lias-surface hover:border-lias-border-strong focus:border-lias-blue transition-colors duration-150
                    placeholder:text-lias-faint"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer
                    text-lias-faint hover:text-lias-ink p-1 rounded"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Se connecter
              </Button>

              <p className="text-center text-[12.5px] text-lias-muted mt-6 mb-0">
                Pas encore membre du laboratoire ?{' '}
                <Link to="/apply" className="text-lias-blue-dark font-medium no-underline hover:underline">
                  Déposer une candidature
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
