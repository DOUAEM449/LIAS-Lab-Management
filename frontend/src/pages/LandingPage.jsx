import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Cpu,
  Network,
  Cog,
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Loader2,
} from 'lucide-react';
import { countPublicMembers } from '../services/memberService';
import { searchPublications } from '../services/publicationService';
import { listTeams } from '../services/governanceService';

const RESEARCH_AXES = [
  {
    icon: Cpu,
    title: 'Informatique & Systèmes Intelligents',
    description:
      "Intelligence artificielle, apprentissage automatique et systèmes de décision appliqués aux problématiques industrielles et scientifiques.",
  },
  {
    icon: Network,
    title: 'Réseaux & Systèmes Distribués',
    description:
      'Architectures distribuées, sécurité des systèmes d’information et infrastructures réseau à grande échelle.',
  },
  {
    icon: Cog,
    title: 'Automatique & Systèmes de Contrôle',
    description:
      "Modélisation, commande et supervision de systèmes automatisés pour l'industrie et la robotique.",
  },
];

function MetricCard({ icon: Icon, value, label, loading }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-4 flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className="text-white text-xl font-bold leading-none">
          {loading ? <Loader2 size={18} className="animate-spin" /> : value}
        </div>
        <div className="text-white/70 text-[12px] mt-1">{label}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [metrics, setMetrics] = useState({ members: 0, publications: 0, teams: 0 });
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [publications, setPublications] = useState([]);
  const [pubLoading, setPubLoading] = useState(true);
  const [pubError, setPubError] = useState(null);

  useEffect(() => {
    setMetricsLoading(true);
    Promise.all([countPublicMembers(), searchPublications({ page: 0, size: 1 }), listTeams()])
      .then(([members, pubPage, teams]) => {
        setMetrics({ members, publications: pubPage.totalElements, teams: teams.length });
      })
      .catch(() => {})
      .finally(() => setMetricsLoading(false));

    setPubLoading(true);
    searchPublications({ page: 0, size: 3, sort: 'year,desc' })
      .then((res) => setPublications(res.content))
      .catch(() => setPubError('Impossible de charger les publications pour le moment.'))
      .finally(() => setPubLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-lias-navy to-lias-blue-dark px-5 sm:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <span className="inline-block text-[11.5px] font-semibold uppercase tracking-wider text-white/70 bg-white/10 px-3 py-1.5 rounded-full mb-5">
              Faculté des Sciences Ben M'Sik — Casablanca
            </span>
            <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Laboratoire d'Informatique &amp; Automatique pour les Systèmes
            </h1>
            <p className="text-white/80 text-[15px] leading-relaxed mb-8">
              Le LIAS mène des recherches d'excellence en intelligence artificielle, systèmes
              distribués et automatique, au service de l'innovation scientifique et industrielle.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 bg-white text-lias-navy no-underline font-semibold text-sm px-5 py-3 rounded-lg hover:bg-white/90"
              >
                Rejoindre le laboratoire
                <ArrowRight size={16} />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center gap-2 border border-white/30 text-white no-underline font-semibold text-sm px-5 py-3 rounded-lg hover:bg-white/10"
              >
                Découvrir le laboratoire
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-14">
            <MetricCard icon={Users} value={metrics.members} label="Chercheurs & membres" loading={metricsLoading} />
            <MetricCard icon={BookOpen} value={metrics.publications} label="Publications scientifiques" loading={metricsLoading} />
            <MetricCard icon={Network} value={metrics.teams} label="Équipes de recherche" loading={metricsLoading} />
          </div>
        </div>
      </section>

      {/* About / Research axes */}
      <section id="about" className="px-5 sm:px-8 py-16 scroll-mt-[68px]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl font-bold text-lias-navy mb-3">Axes de recherche</h2>
            <p className="text-[14px] text-lias-muted leading-relaxed">
              Le laboratoire structure son activité scientifique autour de trois grands axes,
              portés par des équipes pluridisciplinaires.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {RESEARCH_AXES.map((axis) => (
              <div key={axis.title} className="border border-lias-border rounded-xl p-6">
                <div className="w-11 h-11 rounded-lg bg-lias-blue-tint flex items-center justify-center mb-4">
                  <axis.icon size={20} className="text-lias-blue-dark" />
                </div>
                <h3 className="text-[15px] font-semibold text-lias-navy mb-2">{axis.title}</h3>
                <p className="text-[13px] text-lias-muted leading-relaxed">{axis.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Publications preview */}
      <section id="publications" className="px-5 sm:px-8 py-16 bg-lias-bg scroll-mt-[68px]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-lias-navy mb-2">Publications récentes</h2>
              <p className="text-[14px] text-lias-muted">
                Les derniers travaux scientifiques publiés par les membres du laboratoire.
              </p>
            </div>
          </div>

          {pubLoading ? (
            <div className="flex items-center gap-2 text-lias-muted py-10 justify-center">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Chargement...</span>
            </div>
          ) : pubError ? (
            <div className="text-sm text-lias-muted text-center py-10">{pubError}</div>
          ) : publications.length === 0 ? (
            <div className="text-sm text-lias-muted text-center py-10">
              Aucune publication disponible pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {publications.map((p) => (
                <div key={p.id} className="bg-white border border-lias-border rounded-xl p-5">
                  <div className="text-[11.5px] font-mono text-lias-muted mb-2">{p.year}</div>
                  <h3 className="text-[14px] font-semibold text-lias-navy mb-2 leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-[12.5px] text-lias-muted">
                    {p.authors?.map((a) => a.fullName).join(', ') || 'Auteurs non spécifiés'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-5 sm:px-8 py-16 scroll-mt-[68px]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-lias-navy mb-3">Contact</h2>
            <p className="text-[14px] text-lias-muted leading-relaxed mb-6">
              Pour toute question sur nos activités de recherche, nos collaborations ou pour
              rejoindre le laboratoire, n'hésitez pas à nous contacter.
            </p>
            <div className="flex items-start gap-3 mb-3.5">
              <MapPin size={17} className="text-lias-blue-dark mt-0.5 shrink-0" />
              <span className="text-[13.5px] text-lias-ink">
                Faculté des Sciences Ben M'Sik, Casablanca, Maroc
              </span>
            </div>
            <div className="flex items-center gap-3 mb-3.5">
              <Mail size={17} className="text-lias-blue-dark shrink-0" />
              <span className="text-[13.5px] text-lias-ink">contact@lias-lab.ma</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={17} className="text-lias-blue-dark shrink-0" />
              <span className="text-[13.5px] text-lias-ink">+212 5 22 00 00 00</span>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-lias-border h-64 sm:h-auto">
            <iframe
              title="Localisation du laboratoire LIAS"
              className="w-full h-full min-h-[260px] border-none"
              loading="lazy"
              src="https://maps.google.com/maps?q=Facult%C3%A9%20des%20Sciences%20Ben%20M%27Sik%20Casablanca&t=&z=15&ie=UTF8&iwloc=&output=embed"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
