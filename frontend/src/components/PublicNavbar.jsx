import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const ANCHORS = [
  { href: '#about', label: 'À propos' },
  { href: '#publications', label: 'Publications' },
  { href: '#contact', label: 'Contact' },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-lias-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-lg bg-lias-blue flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[15px] font-mono">L</span>
          </div>
          <div>
            <div className="text-lias-navy font-semibold text-base leading-none">LIAS</div>
            <div className="text-lias-muted text-[10.5px] mt-0.5">Laboratoire de Recherche</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {ANCHORS.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="text-[13.5px] font-medium text-lias-ink no-underline hover:text-lias-blue-dark"
            >
              {a.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-[13px] font-semibold text-lias-ink no-underline px-4 py-2 rounded-lg hover:bg-lias-bg"
          >
            Se connecter
          </Link>
          <Link
            to="/apply"
            className="text-[13px] font-semibold text-white no-underline px-4 py-2 rounded-lg bg-lias-blue hover:bg-lias-blue-dark"
          >
            Rejoindre le labo
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden bg-transparent border-none cursor-pointer text-lias-ink p-1"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-lias-border px-5 py-4 flex flex-col gap-3 bg-white">
          {ANCHORS.map((a) => (
            <a
              key={a.href}
              href={a.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-lias-ink no-underline"
            >
              {a.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 mt-2">
            <Link
              to="/login"
              className="text-center text-sm font-semibold text-lias-ink no-underline px-4 py-2.5 rounded-lg border border-lias-border"
            >
              Se connecter
            </Link>
            <Link
              to="/apply"
              className="text-center text-sm font-semibold text-white no-underline px-4 py-2.5 rounded-lg bg-lias-blue"
            >
              Rejoindre le labo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
