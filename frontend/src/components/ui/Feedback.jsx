import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert } from 'lucide-react';

/* Loading, empty and error states — the three screens users actually spend
   time looking at, so they get the same care as the happy path. */

const ALERT_TONES = {
  info: { cls: 'bg-lias-info-bg text-lias-info-text', icon: Info },
  success: { cls: 'bg-lias-success-bg text-lias-success-text', icon: CheckCircle2 },
  warning: { cls: 'bg-lias-warning-bg text-lias-warning-text', icon: TriangleAlert },
  danger: { cls: 'bg-lias-danger-bg text-lias-danger-text', icon: AlertCircle },
};

export function Alert({ tone = 'info', title, children, className = '', action, icon }) {
  const { cls, icon: ToneIcon } = ALERT_TONES[tone] ?? ALERT_TONES.info;
  const Icon = icon ?? ToneIcon;
  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-[13px] ${cls} ${className}`} role="alert">
      <Icon size={16} className="shrink-0 mt-px" />
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        {children}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ size = 18, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

export function LoadingBlock({ label = 'Chargement...', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-14 text-lias-muted text-[13px] ${className}`}>
      <Spinner size={16} />
      {label}
    </div>
  );
}

/** Grey shimmer placeholder. Compose these to mirror the shape of real content. */
export function Skeleton({ className = '' }) {
  return <div className={`lias-shimmer rounded ${className}`} />;
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="px-5.5">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 py-4 border-b border-lias-border-light last:border-b-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-3 ${c === 0 ? 'flex-[2] max-w-[280px]' : 'flex-1 max-w-[140px]'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3, className = '' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-lias-surface border border-lias-border rounded-card p-5">
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state. Always says what the user can do next rather than just
 * announcing that nothing is there.
 */
export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-lias-surface-muted border border-lias-border flex items-center justify-center mb-4">
          <Icon size={20} className="text-lias-faint" />
        </div>
      )}
      <div className="text-[14px] font-semibold text-lias-ink">{title}</div>
      {description && (
        <p className="mt-1.5 mb-0 text-[13px] text-lias-muted max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
