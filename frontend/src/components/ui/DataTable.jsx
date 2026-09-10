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
              className={`text-[11px] font-semibold text-lias-muted uppercase tracking-[0.06em] py-3 px-5.5
                border-b border-lias-border-light whitespace-nowrap
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

export function TD({ children, align = 'left', className = '' }) {
  return (
    <td
      className={`px-5.5 py-3.5 text-[13px] text-lias-ink align-middle
        ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}
    >
      {children}
    </td>
  );
}

/** Primary cell: a strong first line with an optional muted second line. */
export function TDPrimary({ title, subtitle, mono = false, className = '' }) {
  return (
    <td className={`px-5.5 py-3.5 align-middle ${className}`}>
      <div className="text-[13px] font-medium text-lias-ink">{title}</div>
      {subtitle && (
        <div className={`text-[11.5px] text-lias-muted mt-0.5 ${mono ? 'font-mono' : ''}`}>{subtitle}</div>
      )}
    </td>
  );
}

/** Right-aligned container for row action buttons. */
export function TDActions({ children }) {
  return (
    <td className="px-5.5 py-3.5 text-right align-middle">
      <div className="flex gap-2 justify-end">{children}</div>
    </td>
  );
}
