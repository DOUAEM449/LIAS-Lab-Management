import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Shared frame for the standalone auth screens (forgot / reset password), so
 * they carry the same institutional identity as the login page without
 * duplicating its markup.
 */
export default function AuthShell({ title, subtitle, backTo = '/login', backLabel = 'Retour à la connexion', children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lias-bg px-4 py-10">
      <div className="w-full max-w-[400px]">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-lias-muted no-underline
            hover:text-lias-ink mb-6 transition-colors duration-150"
        >
          <ArrowLeft size={15} />
          {backLabel}
        </Link>

        <div className="bg-lias-surface border border-lias-border rounded-card shadow-raised p-8">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-lg bg-lias-navy flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-[15px] font-mono">L</span>
            </div>
            <div>
              <div className="font-semibold text-lias-navy text-[15px] leading-none">LIAS</div>
              <div className="text-[11px] text-lias-muted mt-1">{subtitle}</div>
            </div>
          </div>

          <h1 className="text-[19px] font-bold text-lias-navy tracking-[-0.01em] m-0 mb-5">{title}</h1>

          {children}
        </div>
      </div>
    </div>
  );
}
