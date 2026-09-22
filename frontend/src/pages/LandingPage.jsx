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
  Quote,
  Handshake,
  GraduationCap,
  Building2,
  FileText,
} from 'lucide-react';
import { countPublicMembers } from '../services/memberService';
import { searchPublications } from '../services/publicationService';
import { listTeams } from '../services/governanceService';
import { searchEvents } from '../services/eventService';
import { getLaboratory } from '../services/laboratoryService';
import { searchPartners } from '../services/partnershipService';
import { Skeleton } from '../components/ui/Feedback';

const EVENT_TYPE_LABEL_FR = { CONFERENCE: 'Conférence', WORKSHOP: 'Workshop', SEMINAR: 'Séminaire' };

/* Editorial content: the scientific positioning of the laboratory. It is not
   backed by a database table today (the CdC does not model research axes), so it
   lives here as clearly-identified institutional copy rather than being faked as
   dynamic data. */
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
      "Architectures distribuées, sécurité des systèmes d'information et infrastructures réseau à grande échelle.",
  },
  {
    icon: Cog,
    title: 'Automatique & Systèmes de Contrôle',
    description:
      "Modélisation, commande et supervision de systèmes automatisés pour l'industrie et la robotique.",
  },
];

function SectionHeading({ eyebrow, title, description, className = '' }) {
  return (
    <div className={`max-w-2xl ${className}`}>
      {eyebrow && (
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-lias-blue-dark mb-3">
          {eyebrow}
        </div>
      )}
      <h2 className="text-[26px] sm:text-[30px] font-bold text-lias-navy tracking-[-0.02em] leading-tight m-0">
        {title}
      </h2>
      {description && (
        <p className="text-[14.5px] text-lias-muted leading-relaxed mt-4 mb-0">{description}</p>
      )}
    </div>
  );
}

function Metric({ icon: Icon, value, label, loading }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-sm">
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-white text-[22px] font-bold leading-none tabular-nums">
          {loading ? <span className="inline-block w-10 h-6 rounded bg-white/15 animate-pulse" /> : value}
        </div>
        <div className="text-white/60 text-[12px] mt-1.5">{label}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [lab, setLab] = useState(null);
  const [metrics, setMetrics] = useState({ members: 0, publications: 0, teams: 0 });
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [publications, setPublications] = useState([]);
  const [pubLoading, setPubLoading] = useState(true);

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [partners, setPartners] = useState([]);

  useEffect(() => {
    getLaboratory().then(setLab).catch(() => {});

    setMetricsLoading(true);
    setPubLoading(true);
    setTeamsLoading(true);
    setEventsLoading(true);

    // One call per resource: the metric strip and the section lists are derived
    // from the same responses rather than re-fetched.
    Promise.all([
      countPublicMembers(),
      searchPublications({ page: 0, size: 4, sort: 'year,desc' }),
      listTeams(),
      searchEvents({ page: 0, size: 4, sort: 'startDate,desc' }),
    ])
      .then(([members, pubPage, teamList, eventPage]) => {
        setMetrics({ members, publications: pubPage.totalElements, teams: teamList.length });
        setPublications(pubPage.content);
        setTeams(teamList);
        setEvents(eventPage.content);
      })
      .catch(() => {})
      .finally(() => {
        setMetricsLoading(false);
        setPubLoading(false);
        setTeamsLoading(false);
        setEventsLoading(false);
      });

    // GET /api/v1/partners is public (SecurityConfig permitAll), so the showcase
    // can list real collaborations without authentication.
    searchPartners({ page: 0, size: 12 })
      .then((res) => setPartners(res.content ?? []))
      .catch(() => setPartners([]));
  }, []);

  return (
    <div>
      {/* ============================= HERO ============================= */}
      <section className="relative overflow-hidden bg-lias-navy">
        {/* Restrained institutional texture: a faint grid, not a decorative gradient blob. */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div
          className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full opacity-20 blur-3xl"
          aria-hidden="true"
          style={{ background: 'radial-gradient(circle, oklch(55% 0.09 250), transparent 70%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/70 bg-white/[0.08] border border-white/10 px-3.5 py-1.5 rounded-full mb-6">
              <Building2 size={13} />
              Faculté des Sciences Ben M'Sik — Université Hassan II de Casablanca
            </span>

            <h1 className="text-white text-[34px] sm:text-[46px] font-bold leading-[1.1] tracking-[-0.025em] mb-5">
              {lab?.name || "Laboratoire d'Intelligence Artificielle et Systèmes"}
            </h1>

            <p className="text-white/70 text-[16px] leading-relaxed mb-3 max-w-2xl">
              {lab?.description ||
                "Le LIAS mène des recherches d'excellence en intelligence artificielle, systèmes distribués et automatique, au service de l'innovation scientifique et industrielle."}
            </p>

            {lab?.foundingDate && (
              <p className="text-white/40 text-[12.5px] mb-8 font-mono">
                Laboratoire fondé en {new Date(lab.foundingDate).getFullYear()}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 bg-white text-lias-navy no-underline font-semibold
                  text-[14px] px-6 py-3.5 rounded-lg hover:bg-white/90 transition-colors duration-150"
              >
                Rejoindre le laboratoire
                <ArrowRight size={16} />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center gap-2 border border-white/25 text-white no-underline
                  font-semibold text-[14px] px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors duration-150"
              >
                Découvrir nos recherches
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16">
            <Metric icon={Users} value={metrics.members} label="Chercheurs & membres" loading={metricsLoading} />
            <Metric
              icon={BookOpen}
              value={metrics.publications}
              label="Publications scientifiques"
              loading={metricsLoading}
            />
            <Metric icon={Network} value={metrics.teams} label="Équipes de recherche" loading={metricsLoading} />
          </div>
        </div>
      </section>

      {/* ========================= RESEARCH AXES ========================= */}
      <section id="about" className="px-5 sm:px-8 py-20 scroll-mt-[68px]">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Nos travaux"
            title="Axes de recherche"
            description="Le laboratoire structure son activité scientifique autour de trois grands axes, portés par des équipes pluridisciplinaires et adossés à des collaborations académiques et industrielles."
            className="mb-12"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RESEARCH_AXES.map((axis) => (
              <article
                key={axis.title}
                className="border border-lias-border rounded-xl p-7 bg-white hover:border-lias-blue/40
                  hover:shadow-raised transition-[border-color,box-shadow] duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-lias-blue-tint-solid flex items-center justify-center mb-5">
                  <axis.icon size={21} className="text-lias-blue-dark" />
                </div>
                <h3 className="text-[15.5px] font-semibold text-lias-navy mb-2.5 leading-snug">{axis.title}</h3>
                <p className="text-[13.5px] text-lias-muted leading-relaxed m-0">{axis.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= DIRECTOR'S MESSAGE ======================= */}
      <section className="px-5 sm:px-8 py-20 bg-lias-bg border-y border-lias-border">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-lias-border rounded-2xl p-8 sm:p-12 max-w-4xl mx-auto shadow-card">
            <Quote size={32} className="text-lias-blue/25 mb-6" />
            <blockquote className="m-0 text-[15.5px] sm:text-[16.5px] text-lias-ink leading-[1.75] font-light">
              {lab?.directorMessage ||
                "Bienvenue au Laboratoire d'Intelligence Artificielle et Systèmes. Depuis sa création, le LIAS s'engage à produire une recherche d'excellence au service de l'innovation scientifique et de la formation des jeunes chercheurs. Notre mission est de fédérer nos équipes autour de projets ambitieux, en intelligence artificielle, systèmes distribués et automatique, tout en cultivant des collaborations fortes avec nos partenaires académiques et industriels."}
            </blockquote>
            <footer className="flex items-center gap-4 mt-8 pt-8 border-t border-lias-border-light">
              <div className="w-11 h-11 rounded-full bg-lias-navy flex items-center justify-center shrink-0">
                <Quote size={16} className="text-white" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-lias-navy">
                  {lab?.directorName || 'La direction du laboratoire'}
                </div>
                <div className="text-[12.5px] text-lias-muted mt-0.5">Directeur du LIAS — mot du directeur</div>
              </div>
            </footer>
          </div>
        </div>
      </section>

      {/* ============================= TEAMS ============================= */}
      <section id="teams" className="px-5 sm:px-8 py-20 scroll-mt-[68px]">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Organisation scientifique"
            title="Équipes de recherche"
            description="Le laboratoire est structuré en équipes thématiques, chacune pilotée par un chef d'équipe en mandat."
            className="mb-12"
          />

          {teamsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <p className="text-[14px] text-lias-muted text-center py-12 m-0">
              Aucune équipe publiée pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teams.map((t) => (
                <article key={t.id} className="border border-lias-border rounded-xl p-7 bg-white">
                  <div className="w-12 h-12 rounded-xl bg-lias-blue-tint-solid flex items-center justify-center mb-5">
                    <Network size={21} className="text-lias-blue-dark" />
                  </div>
                  <h3 className="text-[15.5px] font-semibold text-lias-navy mb-2.5">{t.name}</h3>
                  <p className="text-[13.5px] text-lias-muted leading-relaxed m-0 min-h-[42px]">
                    {t.description || 'Équipe de recherche du laboratoire LIAS.'}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-5 pt-5 border-t border-lias-border-light text-[12.5px]">
                    <span className="flex items-center gap-1.5 text-lias-muted min-w-0">
                      <GraduationCap size={14} className="shrink-0" />
                      <span className="truncate">{t.currentLeaderName || 'Direction à pourvoir'}</span>
                    </span>
                    <span className="text-lias-navy font-semibold tabular-nums shrink-0">
                      {t.memberCount} membre(s)
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================ EVENTS ============================= */}
      <section id="events" className="px-5 sm:px-8 py-20 bg-lias-bg border-y border-lias-border scroll-mt-[68px]">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Vie scientifique"
            title="Événements & activités"
            description="Conférences, séminaires et workshops organisés ou accueillis par le laboratoire."
            className="mb-12"
          />

          {eventsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="text-[14px] text-lias-muted text-center py-12 m-0">
              Aucun événement publié pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {events.map((e) => {
                const date = new Date(e.startDate);
                return (
                  <article
                    key={e.id}
                    className="bg-white border border-lias-border rounded-xl p-6 flex gap-5 hover:border-lias-blue/40
                      transition-colors duration-200"
                  >
                    <div className="w-14 shrink-0 text-center border-r border-lias-border-light pr-5">
                      <div className="text-[24px] font-bold text-lias-navy leading-none tabular-nums">
                        {date.getDate()}
                      </div>
                      <div className="text-[11px] uppercase text-lias-muted font-semibold mt-1.5 tracking-wide">
                        {date.toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                      <div className="text-[11px] text-lias-faint font-mono mt-0.5">{date.getFullYear()}</div>
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-lias-blue-dark bg-lias-blue-tint-solid px-2 py-1 rounded mb-2.5">
                        {EVENT_TYPE_LABEL_FR[e.type] || e.type}
                        {e.editionNumber ? ` — ${e.editionNumber}ᵉ édition` : ''}
                      </span>
                      <h3 className="text-[14.5px] font-semibold text-lias-navy mb-1.5 leading-snug">{e.title}</h3>
                      {e.location && (
                        <p className="text-[12.5px] text-lias-muted m-0 flex items-center gap-1.5">
                          <MapPin size={12} className="shrink-0" />
                          {e.location}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========================= PUBLICATIONS ========================= */}
      <section id="publications" className="px-5 sm:px-8 py-20 scroll-mt-[68px]">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Production scientifique"
            title="Publications récentes"
            description="Les derniers travaux scientifiques publiés par les membres du laboratoire."
            className="mb-12"
          />

          {pubLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : publications.length === 0 ? (
            <p className="text-[14px] text-lias-muted text-center py-12 m-0">
              Aucune publication disponible pour le moment.
            </p>
          ) : (
            <div className="border border-lias-border rounded-xl overflow-hidden bg-white">
              {publications.map((p) => (
                <article
                  key={p.id}
                  className="flex items-start gap-5 px-7 py-6 border-b border-lias-border-light last:border-b-0
                    hover:bg-lias-bg/60 transition-colors duration-150"
                >
                  <div className="w-10 h-10 rounded-lg bg-lias-blue-tint-solid flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={17} className="text-lias-blue-dark" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14.5px] font-semibold text-lias-navy leading-snug m-0 mb-2">
                      {p.title}
                    </h3>
                    <p className="text-[13px] text-lias-muted m-0 leading-relaxed">
                      {p.authors?.map((a) => a.fullName).join(', ') || 'Auteurs non spécifiés'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[12px] text-lias-faint">
                      <span className="font-mono font-semibold text-lias-blue-dark">{p.year}</span>
                      {p.teamName && <span>{p.teamName}</span>}
                      {p.doi && <span className="font-mono truncate">DOI : {p.doi}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================== PARTNERS =========================== */}
      {partners.length > 0 && (
        <section className="px-5 sm:px-8 py-20 bg-lias-bg border-y border-lias-border">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              eyebrow="Collaborations"
              title="Nos partenaires"
              description="Le laboratoire développe des collaborations académiques et industrielles, nationales et internationales."
              className="mb-12"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {partners.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-lias-border rounded-xl px-5 py-6 flex flex-col items-center
                    justify-center text-center gap-3"
                >
                  <div className="w-11 h-11 rounded-lg bg-lias-blue-tint-solid flex items-center justify-center">
                    <Handshake size={19} className="text-lias-blue-dark" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-lias-navy truncate">{p.name}</div>
                    {p.country && <div className="text-[11.5px] text-lias-muted mt-0.5">{p.country}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================ CONTACT ============================ */}
      <section id="contact" className="px-5 sm:px-8 py-20 scroll-mt-[68px]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <SectionHeading
              eyebrow="Nous joindre"
              title="Contact"
              description="Pour toute question sur nos activités de recherche, nos collaborations ou pour rejoindre le laboratoire, n'hésitez pas à nous contacter."
              className="mb-8"
            />

            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-lias-blue-tint-solid flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-lias-blue-dark" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-lias-faint mb-0.5">
                    Adresse
                  </div>
                  <span className="text-[14px] text-lias-ink">
                    Faculté des Sciences Ben M'Sik, Casablanca, Maroc
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-lias-blue-tint-solid flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-lias-blue-dark" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-lias-faint mb-0.5">
                    Email
                  </div>
                  <span className="text-[14px] text-lias-ink">contact@lias-lab.ma</span>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-lias-blue-tint-solid flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-lias-blue-dark" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-lias-faint mb-0.5">
                    Téléphone
                  </div>
                  <span className="text-[14px] text-lias-ink">+212 5 22 00 00 00</span>
                </div>
              </div>
            </div>

            <Link
              to="/apply"
              className="inline-flex items-center gap-2 mt-9 bg-lias-blue text-white no-underline font-semibold
                text-[14px] px-6 py-3.5 rounded-lg hover:bg-lias-blue-hover transition-colors duration-150"
            >
              Déposer une candidature
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-xl overflow-hidden border border-lias-border h-[380px]">
            <iframe
              title="Localisation du laboratoire LIAS"
              className="w-full h-full border-none"
              loading="lazy"
              src="https://maps.google.com/maps?q=Facult%C3%A9%20des%20Sciences%20Ben%20M%27Sik%20Casablanca&t=&z=15&ie=UTF8&iwloc=&output=embed"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
