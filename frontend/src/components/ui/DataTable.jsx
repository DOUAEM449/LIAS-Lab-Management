/*
 * A thin, presentational table. It deliberately does not own data fetching,
 * sorting or pagination — pages already handle those against the backend —
 * it only guarantees that every table in LIAS looks and behaves the same.
 */

export function Table({ children, minWidth = 'min-w-[760px]', className = '' }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${minWidth} ${className}`}>{children}</table>
    </div>
  );
}

/** `columns` accepts strings, or { label, align, width } for finer control. */
export function THead({ columns }) {
  return (
    <thead>
      <tr className="bg-lias-surface-muted">
        {columns.map((col, i) => {
          const { label, align = 'left', width } = typeof col === 'string' ? { label: col } : col;
          return (
            <th
              key={`${label}-${i}`}
              style={width ? { width } : undefined}
              /* UI — l'en-tête est posé sur un filet plus marqué que les séparateurs
                 de lignes, pour rester identifiable quand la table est longue. */
              className={`text-micro font-semibold text-lias-muted uppercase tracking-[0.07em] py-2.5 px-5.5
                border-b border-lias-border whitespace-nowrap
                ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
            >
              {label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export function TBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TR({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-lias-border-light last:border-b-0 transition-colors duration-150
        ${onClick ? 'cursor-pointer hover:bg-lias-surface-muted/70' : 'hover:bg-lias-surface-muted/40'} ${className}`}
    >
      {children}
    </tr>
  );
}

/* UI — la hauteur de ligne passe de py-3.5 à py-3 : à densité de contenu égale,
   deux lignes de plus tiennent à l'écran sans que la table paraisse serrée. */
export function TD({ children, align = 'left', className = '' }) {
  return (
    <td
      className={`px-5.5 py-3 text-body-sm text-lias-ink align-middle
        ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}
    >
      {children}
    </td>
  );
}

/** Primary cell: a strong first line with an optional muted second line. */
export function TDPrimary({ title, subtitle, mono = false, className = '' }) {
  return (
    <td className={`px-5.5 py-3 align-middle ${className}`}>
      <div className="text-body-sm font-semibold text-lias-ink">{title}</div>
      {subtitle && (
        <div className={`text-meta text-lias-muted mt-0.5 ${mono ? 'font-mono' : ''}`}>{subtitle}</div>
      )}
    </td>
  );
}

/** Right-aligned container for row action buttons. */
export function TDActions({ children }) {
  return (
    <td className="px-5.5 py-3 text-right align-middle">
      <div className="flex gap-2 justify-end">{children}</div>
    </td>
  );
}
