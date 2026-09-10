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
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lias-blue-dark mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="m-0 text-[23px] font-bold text-lias-navy tracking-[-0.01em]">{title}</h1>
        {description && (
          <p className="mt-2 mb-0 text-[13.5px] text-lias-muted leading-relaxed max-w-2xl">{description}</p>
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
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && <Icon size={16} className="text-lias-blue-dark shrink-0 mt-0.5" />}
        <div className="min-w-0">
          <h2 className="m-0 text-[14.5px] font-semibold text-lias-navy">{title}</h2>
          {description && <p className="m-0 mt-1 text-[12.5px] text-lias-muted">{description}</p>}
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
    <div
      className={`flex items-center gap-2.5 bg-lias-surface border border-lias-border rounded-lg px-3 py-2
        focus-within:border-lias-blue transition-colors duration-150 ${className}`}
    >
      <Search size={15} className="text-lias-faint shrink-0" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border-none outline-none bg-transparent text-[13px] w-full text-lias-ink placeholder:text-lias-faint"
      />
    </div>
  );
}

/** Segmented tab control used for in-page section switching. */
export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1 bg-lias-surface-muted rounded-lg p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-medium cursor-pointer border-none
            transition-colors duration-150 inline-flex items-center gap-1.5
            ${
              active === tab.key
                ? 'bg-lias-surface text-lias-navy shadow-card font-semibold'
                : 'bg-transparent text-lias-muted hover:text-lias-ink'
            }`}
        >
          {tab.icon && <tab.icon size={13} />}
          {tab.label}
          {tab.count > 0 && (
            <span className="ml-0.5 text-[10.5px] font-semibold bg-lias-blue text-white rounded-full px-1.5 py-px">
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
    <div
      className={`bg-lias-surface border border-lias-border rounded-card shadow-card p-5
        transition-colors duration-150 hover:border-lias-border-strong ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12.5px] text-lias-muted font-medium leading-snug">{label}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-[10px] bg-lias-blue-tint-solid flex items-center justify-center shrink-0">
            <Icon size={16} className="text-lias-blue-dark" strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="text-[30px] font-bold text-lias-navy mt-3 leading-none tracking-[-0.02em]">
        {loading ? <span className="lias-shimmer inline-block w-14 h-7 rounded align-middle" /> : value}
      </div>
      {hint && !loading && <div className={`text-[12px] mt-2 font-medium ${hintColor}`}>{hint}</div>}
    </div>
  );
}

/** Label / value pair used in detail panels and profile headers. */
export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lias-faint mb-1">{label}</div>
      <div className="text-[13.5px] text-lias-ink">{children ?? <span className="text-lias-faint">—</span>}</div>
    </div>
  );
}
