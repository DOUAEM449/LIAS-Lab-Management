/*
 * Badges carry meaning, not decoration. Three families are used across LIAS and
 * they are deliberately visually distinct, because the CdC (§2.21) requires the
 * user to never confuse them:
 *
 *   STATUT  (MemberStatus)   — membership category, slow moving
 *   RÔLE    (RoleName)       — effective permissions, derived
 *   MANDAT  (MandateRoleType)— time-bound governance responsibility
 */

const TONES = {
  neutral: 'bg-lias-surface-muted text-lias-muted border-lias-border',
  info: 'bg-lias-info-bg text-lias-info-text border-transparent',
  success: 'bg-lias-success-bg text-lias-success-text border-transparent',
  warning: 'bg-lias-warning-bg text-lias-warning-text border-transparent',
  danger: 'bg-lias-danger-bg text-lias-danger-text border-transparent',
  mandate: 'bg-lias-mandate-bg text-lias-mandate-text border-transparent',
  outline: 'bg-transparent text-lias-ink-soft border-lias-border-strong',
};

export default function Badge({ tone = 'neutral', icon: Icon, size = 'md', className = '', children }) {
  const sizing = size === 'sm' ? 'text-[10.5px] px-2 py-0.5 gap-1' : 'text-[11.5px] px-2.5 py-1 gap-1.5';
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold leading-none whitespace-nowrap
        ${sizing} ${TONES[tone] ?? TONES.neutral} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 10 : 11} className="shrink-0" />}
      {children}
    </span>
  );
}

/* --- Domain badges -------------------------------------------------------- */

export const MEMBER_STATUS_LABEL = {
  PERMANENT: 'Permanent',
  ASSOCIATE: 'Associé',
  PHD_STUDENT: 'Doctorant',
  RETIRED: 'Retraité',
  FORMER: 'Ancien membre',
};

const MEMBER_STATUS_TONE = {
  PERMANENT: 'success',
  ASSOCIATE: 'info',
  PHD_STUDENT: 'info',
  RETIRED: 'warning',
  FORMER: 'neutral',
};

/** STATUT — the member's membership category (CdC §2.2). */
export function StatusBadge({ status, size = 'md' }) {
  if (!status) return <span className="text-lias-faint text-[12px]">—</span>;
  return (
    <Badge tone={MEMBER_STATUS_TONE[status] ?? 'neutral'} size={size}>
      {MEMBER_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export const ROLE_LABEL = {
  SYSTEM_ADMIN: 'Administrateur système',
  DIRECTOR: 'Directeur',
  VICE_DIRECTOR: 'Vice-directeur',
  TEAM_LEADER: "Chef d'équipe",
  PERMANENT_MEMBER: 'Membre permanent',
  ASSOCIATE_MEMBER: 'Membre associé',
  PHD_STUDENT: 'Doctorant',
  RETIRED_MEMBER: 'Retraité',
  FORMER_MEMBER: 'Ancien membre',
};

/** RÔLE — the effective Spring Security role, derived from statut + mandat. */
export function RoleBadge({ role, size = 'md' }) {
  if (!role) return <span className="text-lias-faint text-[12px]">—</span>;
  const governance = ['SYSTEM_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR', 'TEAM_LEADER'].includes(role);
  return (
    <Badge tone={governance ? 'outline' : 'neutral'} size={size}>
      {ROLE_LABEL[role] ?? role}
    </Badge>
  );
}

export const MANDATE_LABEL = {
  DIRECTOR: 'Directeur',
  VICE_DIRECTOR: 'Vice-directeur',
  TEAM_LEADER: "Chef d'équipe",
};

/** MANDAT — a dated governance responsibility; violet is reserved for it alone. */
export function MandateBadge({ role, active = true, size = 'md' }) {
  return (
    <Badge tone={active ? 'mandate' : 'neutral'} size={size}>
      {MANDATE_LABEL[role] ?? role}
    </Badge>
  );
}

export const REQUEST_STATUS_LABEL = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  FULFILLED: 'Servie',
};

const REQUEST_STATUS_TONE = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  FULFILLED: 'info',
};

/** Workflow decision state, shared by membership and equipment requests. */
export function RequestStatusBadge({ status, size = 'md' }) {
  if (!status) return null;
  return (
    <Badge tone={REQUEST_STATUS_TONE[status] ?? 'neutral'} size={size}>
      {REQUEST_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
