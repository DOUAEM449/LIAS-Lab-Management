import { MapPin, Mail, Phone } from 'lucide-react';

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-lias-navy text-lias-navy-text mt-auto">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-lias-blue flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs font-mono">L</span>
            </div>
            <span className="text-white font-semibold">LIAS</span>
          </div>
          <p className="text-[13px] leading-relaxed">
            Laboratoire de recherche en Informatique &amp; Automatique pour les Systèmes —
            Faculté des Sciences Ben M'Sik, Université Hassan II de Casablanca.
          </p>
        </div>

        <div>
          <div className="text-white text-[13px] font-semibold mb-3 uppercase tracking-wide">
            Coordonnées
          </div>
          <div className="flex items-start gap-2.5 text-[13px] mb-2.5">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            <span>Faculté des Sciences Ben M'Sik, Casablanca, Maroc</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] mb-2.5">
            <Mail size={15} className="shrink-0" />
            <span>contact@lias-lab.ma</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px]">
            <Phone size={15} className="shrink-0" />
            <span>+212 5 22 00 00 00</span>
          </div>
        </div>

        <div>
          <div className="text-white text-[13px] font-semibold mb-3 uppercase tracking-wide">
            Liens rapides
          </div>
          <div className="flex flex-col gap-2 text-[13px]">
            <a href="#about" className="text-lias-navy-text no-underline hover:text-white">
              À propos du laboratoire
            </a>
            <a href="#publications" className="text-lias-navy-text no-underline hover:text-white">
              Publications
            </a>
            <a href="/apply" className="text-lias-navy-text no-underline hover:text-white">
              Rejoindre le laboratoire
            </a>
            <a href="/login" className="text-lias-navy-text no-underline hover:text-white">
              Espace membres
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-lias-navy-light py-4 text-center text-[12px]">
        © {year} LIAS Laboratory. Tous droits réservés.
      </div>
    </footer>
  );
}
