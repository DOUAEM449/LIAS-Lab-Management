import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { login } from '../services/authService';

export default function LoginPage({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onLoggedIn();
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lias-bg px-4">
      <Link
        to="/"
        className="flex items-center gap-1.5 text-[13px] font-medium text-lias-muted no-underline hover:text-lias-ink mb-5 w-full max-w-sm"
      >
        <ArrowLeft size={15} />
        Retour au site public
      </Link>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-lias-border rounded-xl p-8 w-full max-w-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-lias-blue flex items-center justify-center">
            <span className="text-white font-bold text-[15px] font-mono">L</span>
          </div>
          <div>
            <div className="font-semibold text-lias-navy">LIAS</div>
            <div className="text-[11px] text-lias-muted">Administration</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-lias-danger-bg text-lias-danger-text text-sm rounded-lg px-3 py-2.5">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <label className="block text-xs font-medium text-lias-muted mb-1.5">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2.5 border border-lias-border rounded-lg text-sm outline-none focus:border-lias-blue"
          placeholder="admin@lias.ma"
        />

        <label className="block text-xs font-medium text-lias-muted mb-1.5">Mot de passe</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2.5 border border-lias-border rounded-lg text-sm outline-none focus:border-lias-blue"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-lias-blue text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Se connecter
        </button>
      </form>
    </div>
  );
}
