import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

const ANCHORS = [
  { href: '#about', label: 'Recherche' },
  { href: '#teams', label: 'Équipes' },
  { href: '#events', label: 'Événements' },
  { href: '#publications', label: 'Publications' },
  { href: '#contact', label: 'Contact' },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // A hairline shadow appears only once the page has scrolled, so the navbar
  // sits flat against the hero at rest.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b transition-[border-color,box-shadow] duration-200
        ${scrolled ? 'border-lias-border shadow-card' : 'border-transparent'}`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 no-underline shrink-0">
          <div className="w-9 h-9 rounded-lg bg-lias-navy flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[15px] font-mono">L</span>
          </div>
          <div>
            <div className="text-lias-navy font-semibold text-[16px] leading-none tracking-tight">LIAS</div>
            <div className="text-lias-muted text-[10.5px] mt-1">Laboratoire de recherche</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {ANCHORS.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="text-[13.5px] font-medium text-lias-ink-soft no-underline hover:text-lias-blue-dark
                transition-colors duration-150"
            >
              {a.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Link
            to="/login"
            className="text-[13px] font-semibold text-lias-ink no-underline px-4 py-2.5 rounded-lg
              hover:bg-lias-surface-muted transition-colors duration-150"
          >
            Espace membres
          </Link>
          <Link
            to="/apply"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white no-underline px-4 py-2.5
              rounded-lg bg-lias-blue hover:bg-lias-blue-hover transition-colors duration-150"
          >
            Nous rejoindre
            <ArrowRight size={14} />
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
          className="lg:hidden bg-transparent border-none cursor-pointer text-lias-ink p-1 shrink-0"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-lias-border px-5 py-5 flex flex-col gap-4 bg-white lias-enter">
          {ANCHORS.map((a) => (
            <a
              key={a.href}
              href={a.href}
              onClick={() => setOpen(false)}
              className="text-[14px] font-medium text-lias-ink no-underline"
            >
              {a.label}
            </a>
          ))}
          <div className="flex flex-col gap-2.5 mt-2 pt-4 border-t border-lias-border-light">
            <Link
              to="/login"
              className="text-center text-[13.5px] font-semibold text-lias-ink no-underline px-4 py-3
                rounded-lg border border-lias-border"
            >
              Espace membres
            </Link>
            <Link
              to="/apply"
              className="text-center text-[13.5px] font-semibold text-white no-underline px-4 py-3
                rounded-lg bg-lias-blue"
            >
              Nous rejoindre
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
