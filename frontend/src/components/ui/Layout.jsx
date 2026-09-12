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
          /* UI — le sur-titre est rattaché au titre par un court filet : il se lit
             comme une étiquette de rubrique plutôt que comme une ligne flottante. */
          <div className="flex items-center gap-2 mb-2">
            <span className="h-3 w-[3px] rounded-full bg-lias-blue" aria-hidden="true" />
            <span className="text-micro font-semibold uppercase tracking-[0.09em] text-lias-blue-dark">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="m-0 text-display font-bold text-lias-navy tracking-[-0.015em]">{title}</h1>
        {description && (
          <p className="mt-2 mb-0 text-body-sm text-lias-muted max-w-2xl">{description}</p>
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
          <span className="w-7 h-7 rounded-control bg-lias-blue-tint-solid flex items-center justify-center shrink-0">
            <Icon size={15} className="text-lias-blue-dark" />
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
    /* UI — la tuile est désormais une colonne flex : le libellé et le chiffre
       restent groupés en haut et l'indice est poussé en bas, de sorte que des
       tuiles avec et sans indice s'alignent au lieu de laisser un vide flottant.
       Le survol la soulève légèrement pour signaler qu'elle forme un bloc. */
    <div
      className={`flex flex-col bg-lias-surface border border-lias-border rounded-card shadow-card p-5 h-full
        transition-[border-color,box-shadow,transform] duration-150
        hover:border-lias-border-strong hover:shadow-raised hover:-translate-y-px ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-meta text-lias-muted font-medium leading-snug">{label}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-control bg-lias-blue-tint-solid flex items-center justify-center shrink-0">
            <Icon size={16} className="text-lias-blue-dark" strokeWidth={2} />
          </div>
        )}
      </div>
      {/* tabular-nums : les chiffres gardent la même chasse d'une tuile à l'autre. */}
      <div className="text-metric font-bold text-lias-navy mt-3 tracking-[-0.025em] tabular-nums">
        {loading ? <span className="lias-shimmer inline-block w-14 h-7 rounded align-middle" /> : value}
      </div>
      {hint && !loading && <div className={`text-meta mt-auto pt-2 font-medium ${hintColor}`}>{hint}</div>}
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
