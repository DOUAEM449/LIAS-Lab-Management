/*
 * Two small, dependency-free charts.
 *
 * The project intentionally does not pull in a charting library for this: the
 * dashboard needs exactly two shapes, both trivially expressible in CSS, and a
 * 100 kB dependency for six bars would be a poor trade. Both components render
 * only the values they are given — there is no sample or placeholder data.
 */

/** Vertical bars, one per period. `data` = [{ label, value }]. */
export function BarChart({ data, height = 150, emptyLabel = 'Aucune donnée sur la période' }) {
  const max = Math.max(...data.map((d) => d.value), 0);

  if (max === 0) {
    return (
      <div
        className="flex items-center justify-center text-[12.5px] text-lias-muted"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between gap-2 sm:gap-3" style={{ height }}>
      {data.map((d) => {
        const ratio = d.value / max;
        return (
          /* UI — le chiffre et le libellé occupent leur hauteur naturelle (shrink-0)
             et la barre se partage l'espace restant. Auparavant la barre visait
             100 % de la colonne : sur la valeur maximale, les trois éléments
             dépassaient la hauteur fixe et l'étiquette de l'année décrochait. */
          <div key={d.label} className="flex-1 flex flex-col items-center h-full gap-2 min-w-0">
            <span className="text-meta font-semibold text-lias-navy tabular-nums shrink-0">{d.value}</span>
            <div className="flex-1 w-full flex items-end justify-center min-h-0">
              <div
                className="w-full max-w-[46px] rounded-t-md bg-lias-blue/85 hover:bg-lias-blue
                  transition-[height,background-color] duration-300"
                style={{ height: `${Math.max(ratio * 100, 3)}%` }}
                title={`${d.label} : ${d.value}`}
              />
            </div>
            <span className="text-micro text-lias-muted font-mono truncate w-full text-center shrink-0">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Single stacked bar showing how a total splits across categories, with a
 * legend underneath. `data` = [{ label, value, className }].
 */
export function DistributionBar({ data, emptyLabel = 'Aucune donnée' }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <div className="text-[12.5px] text-lias-muted py-4 text-center">{emptyLabel}</div>;
  }

  return (
    <div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-lias-surface-muted">
        {data
          .filter((d) => d.value > 0)
          .map((d) => (
            <div
              key={d.label}
              className={`${d.className} transition-[width] duration-300`}
              style={{ width: `${(d.value / total) * 100}%` }}
              title={`${d.label} : ${d.value}`}
            />
          ))}
      </div>

      <ul className="list-none p-0 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className="flex items-center gap-2 text-lias-ink-soft min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.className}`} />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="font-semibold text-lias-navy tabular-nums shrink-0">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
