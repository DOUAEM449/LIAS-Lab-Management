import { Search } from 'lucide-react';

/* Page-level scaffolding. Every screen in the dashboard is built from these,
   which is what makes the application read as one product rather than twenty
   separately-styled CRUD pages. */

/**
 * Standard page heading: an optional eyebrow, the title, one line of context,
 * and the screen's actions aligned to the right.
 */
export function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          /* UI — le sur-titre devient une puce teintée à part entière : il se lit
             comme une étiquette de rubrique et non comme une ligne flottante. */
          <div className="inline-flex items-center gap-2 mb-3 rounded-full bg-lias-blue-tint-solid px-3 py-1">
            <span className="lias-gradient-brand h-1.5 w-1.5 rounded-full" aria-hidden="true" />
            <span className="text-micro font-bold uppercase tracking-[0.1em] text-lias-blue-dark">
              {eyebrow}
            </span>
          </div>
        )}
        {/* Le titre de page monte en puissance : plus grand, plus gras, plus serré. */}
        <h1 className="m-0 text-display font-extrabold text-lias-navy tracking-[-0.03em]">{title}</h1>
        {description && (
          <p className="mt-2.5 mb-0 text-body-sm text-lias-muted max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

/** The white bordered surface every block of content sits on. */
export function Card({ children, className = '', padded = false }) {
  return (
    <div
      className={`bg-lias-surface border border-lias-border rounded-card shadow-card overflow-hidden
        ${padded ? 'p-5.5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/** Header strip inside a Card: title on the left, actions on the right. */
export function CardHeader({ icon: Icon, title, description, actions, className = '' }) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5.5 py-4
        border-b border-lias-border-light ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {/* UI — l'icône est posée sur une pastille teintée : elle devient un repère
            de section au lieu d'un glyphe isolé perdu à côté du titre. */}
        {Icon && (
          <span className="lias-gradient-brand w-8 h-8 rounded-control flex items-center justify-center shrink-0 shadow-glow">
            <Icon size={15} className="text-white" strokeWidth={2.2} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="m-0 text-title-sm font-semibold text-lias-navy tracking-[-0.005em]">{title}</h2>
          {description && <p className="m-0 mt-0.5 text-meta text-lias-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** Filter / search strip, normally the first row inside a Card. */
export function Toolbar({ children, className = '' }) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5.5 py-3.5
        border-b border-lias-border-light bg-lias-surface-muted/40 ${className}`}
    >
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher...', className = '' }) {
  return (
    /* UI — le champ signale le focus par un halo teinté en plus de la bordure,
       cohérent avec le traitement de focus global défini dans index.css. */
    <div
      className={`flex items-center gap-2.5 bg-lias-surface border border-lias-border rounded-control px-3 py-2
        focus-within:border-lias-blue focus-within:ring-2 focus-within:ring-lias-blue/15
        transition-[border-color,box-shadow] duration-150 ${className}`}
    >
      <Search size={15} className="text-lias-faint shrink-0" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border-none outline-none bg-transparent text-body-sm w-full text-lias-ink placeholder:text-lias-faint"
      />
    </div>
  );
}

/** Segmented tab control used for in-page section switching. */
export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    /* UI — le rail conserve un liseré, et l'onglet actif est surélevé plutôt que
       simplement coloré : la sélection reste lisible même en niveaux de gris. */
    <div
      className={`inline-flex items-center gap-1 bg-lias-surface-muted border border-lias-border-light
        rounded-control p-1 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-3.5 py-1.5 rounded-[6px] text-meta font-medium cursor-pointer border-none
            transition-[background-color,color,box-shadow] duration-150 inline-flex items-center gap-1.5
            ${
              active === tab.key
                ? 'bg-lias-surface text-lias-navy shadow-card font-semibold'
                : 'bg-transparent text-lias-muted hover:text-lias-ink hover:bg-lias-surface/60'
            }`}
        >
          {tab.icon && <tab.icon size={13} />}
          {tab.label}
          {tab.count > 0 && (
            <span className="ml-0.5 text-[10.5px] font-semibold bg-lias-blue text-white rounded-full px-1.5 py-px tabular-nums">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * KPI tile. `hint` carries the interpretation of the number (what it counts,
 * or what needs doing) so the figure is never left to speak for itself.
 */
export function StatTile({ label, value, hint, hintTone = 'muted', icon: Icon, loading, className = '' }) {
  const hintColor = {
    muted: 'text-lias-muted',
    success: 'text-lias-success-text',
    warning: 'text-lias-warning-text',
    danger: 'text-lias-danger-text',
  }[hintTone];

  return (
    /* UI — la tuile devient l'élément le plus affirmé de l'écran : chiffre en
       dégradé de marque, pastille d'icône pleine avec lueur colorée, et un
       liseré supérieur qui s'illumine au survol. Colonne flex pour que l'indice
       soit poussé en bas et que les tuiles s'alignent, avec ou sans indice. */
    <div
      className={`group relative flex flex-col overflow-hidden bg-lias-surface border border-lias-border
        rounded-card shadow-card p-5 h-full
        transition-[border-color,box-shadow,transform] duration-200
        hover:border-lias-blue/35 hover:shadow-raised hover:-translate-y-0.5 ${className}`}
    >
      {/* Liseré supérieur : invisible au repos, révélé au survol. */}
      <span
        className="lias-gradient-brand absolute inset-x-0 top-0 h-[3px] opacity-0
          transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <span className="text-meta text-lias-muted font-semibold leading-snug uppercase tracking-[0.04em]">
          {label}
        </span>
        {Icon && (
          <div
            className="lias-gradient-brand w-10 h-10 rounded-control flex items-center justify-center shrink-0
              shadow-glow transition-transform duration-200 group-hover:scale-105"
          >
            <Icon size={17} className="text-white" strokeWidth={2.2} />
          </div>
        )}
      </div>
      {/* tabular-nums : les chiffres gardent la même chasse d'une tuile à l'autre. */}
      <div className="text-metric font-extrabold mt-3.5 tracking-[-0.03em] tabular-nums">
        {loading ? (
          <span className="lias-shimmer inline-block w-14 h-8 rounded align-middle" />
        ) : (
          <span className="lias-gradient-text">{value}</span>
        )}
      </div>
      {hint && !loading && <div className={`text-meta mt-auto pt-2.5 font-medium ${hintColor}`}>{hint}</div>}
    </div>
  );
}

/** Label / value pair used in detail panels and profile headers. */
export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <div className="text-micro font-semibold uppercase tracking-[0.07em] text-lias-faint mb-1">{label}</div>
      <div className="text-body-sm text-lias-ink">{children ?? <span className="text-lias-faint">—</span>}</div>
    </div>
  );
}
