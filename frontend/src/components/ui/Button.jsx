import { Loader2 } from 'lucide-react';

/*
 * The single button vocabulary for the whole application.
 *
 * `primary`   — the one affirmative action of a screen (create, submit, approve)
 * `secondary` — neutral actions sitting next to a primary one (cancel, close)
 * `ghost`     — low-emphasis actions inside toolbars and table rows
 * `danger`    — destructive confirmation (archive, delete, reject)
 * `subtle`    — tinted, used for secondary navigation-like actions
 */
/* UI — chaque variante gagne un état de survol ET un état actif distincts.
   La variante primaire porte en plus un liseré interne clair en haut, qui donne
   au bouton un relief léger sans recourir à un dégradé. */
const VARIANTS = {
  primary:
    'bg-lias-blue text-white border border-lias-blue-hover shadow-card hover:bg-lias-blue-hover ' +
    'hover:shadow-raised active:translate-y-px active:shadow-card',
  secondary:
    'bg-lias-surface text-lias-ink border border-lias-border shadow-card ' +
    'hover:border-lias-border-strong hover:bg-lias-surface-muted active:translate-y-px',
  ghost:
    'bg-transparent text-lias-muted border border-transparent hover:bg-lias-surface-muted hover:text-lias-ink',
  danger:
    'bg-lias-surface text-lias-danger-text border border-lias-danger-bg hover:bg-lias-danger-bg active:translate-y-px',
  'danger-solid':
    'bg-lias-danger text-white border border-transparent shadow-card hover:brightness-95 ' +
    'hover:shadow-raised active:translate-y-px active:shadow-card',
  subtle:
    'bg-lias-blue-tint-solid text-lias-blue-dark border border-transparent hover:brightness-95 active:translate-y-px',
};

/* Rayon aligné sur --radius-control, commun aux boutons, champs et onglets. */
const SIZES = {
  sm: 'text-meta px-3 py-1.5 gap-1.5 rounded-control',
  md: 'text-body-sm px-4 py-2.5 gap-2 rounded-control',
  lg: 'text-body px-5 py-3 gap-2 rounded-control',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-semibold cursor-pointer whitespace-nowrap
        transition-[background-color,border-color,color,transform,filter,box-shadow] duration-150
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:shadow-none
        ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin shrink-0" />
      ) : (
        Icon && !iconRight && <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />
      )}
      {children}
      {Icon && iconRight && !loading && <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />}
    </button>
  );
}

/** Square icon-only button, used for row actions in tables. */
export function IconButton({ icon: Icon, label, variant = 'secondary', className = '', ...props }) {
  /* UI — le survol teinte aussi le fond : sur une ligne de tableau dense,
     la bordure seule ne suffisait pas à marquer la cible active. */
  const styles = {
    secondary:
      'border-lias-border text-lias-muted hover:text-lias-blue-dark hover:border-lias-blue hover:bg-lias-blue-tint-solid',
    danger: 'border-lias-danger-bg text-lias-danger-text hover:bg-lias-danger-bg hover:border-lias-danger',
  };
  return (
    <button
      title={label}
      aria-label={label}
      className={`w-8 h-8 rounded-control border bg-lias-surface cursor-pointer inline-flex items-center justify-center
        transition-[background-color,border-color,color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed
        ${styles[variant] ?? styles.secondary} ${className}`}
      {...props}
    >
      <Icon size={14} />
    </button>
  );
}
