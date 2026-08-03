import { Loader2 } from 'lucide-react';

const STATUS_STYLE = {
  PENDING: 'bg-lias-warning-bg text-lias-warning-text',
  APPROVED: 'bg-lias-success-bg text-lias-success-text',
  REJECTED: 'bg-lias-danger-bg text-lias-danger-text',
};

const STATUS_LABEL_FR = {
  PENDING: 'En attente',
  APPROVED: 'Acceptée',
  REJECTED: 'Refusée',
};

// Deterministic pseudo-random hue per person so avatar colors stay stable
// across re-renders without needing a color field from the backend.
function avatarHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function initialsOf(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export default function RequestsTable({ requests, loading, actionLoadingId, onApprove, onReject }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-lias-muted gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Chargement des demandes...</span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-lias-muted text-sm">
        Aucune demande d'adhésion en attente.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[760px]">
        <thead>
          <tr className="bg-lias-bg">
            {['Photo', 'Nom / Prénom', "Établissement d'origine", 'Date', 'Statut', ''].map(
              (h, i) => (
                <th
                  key={h + i}
                  className={`text-[11.5px] font-semibold text-lias-muted uppercase tracking-wider py-3 ${
                    i === 0 ? 'px-5 text-left' : i === 5 ? 'px-5 text-right' : 'px-3 text-left'
                  }`}
                >
                  {i === 5 ? 'Actions' : h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const fullName = `${r.firstName} ${r.lastName}`;
            const hue = avatarHue(fullName);
            const isPending = r.status === 'PENDING';
            const isActing = actionLoadingId === r.id;

            return (
              <tr key={r.id} className="border-t border-lias-border-light">
                <td className="px-5 py-3.5">
                  <div
                    className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ background: `oklch(60% 0.1 ${hue})` }}
                  >
                    {initialsOf(r.firstName, r.lastName)}
                  </div>
                </td>
                <td className="px-3 py-3.5 text-[13px] font-medium text-lias-ink">{fullName}</td>
                <td className="px-3 py-3.5 text-[13px] text-lias-muted">
                  {r.homeInstitution || '—'}
                </td>
                <td className="px-3 py-3.5 text-[13px] text-lias-muted font-mono">
                  {new Date(r.submittedAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-3 py-3.5">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${STATUS_STYLE[r.status]}`}
                  >
                    {STATUS_LABEL_FR[r.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {isPending ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => onApprove(r.id)}
                        disabled={isActing}
                        className="bg-lias-success text-white border-none rounded-[7px] px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {isActing && <Loader2 size={12} className="animate-spin" />}
                        Accepter
                      </button>
                      <button
                        onClick={() => onReject(r.id)}
                        disabled={isActing}
                        className="bg-white text-lias-danger-text border border-lias-danger-bg rounded-[7px] px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Refuser
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-lias-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
