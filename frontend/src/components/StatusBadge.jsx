const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

const STATUS_LABEL_FR = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL_FR[status]}
    </span>
  );
}
