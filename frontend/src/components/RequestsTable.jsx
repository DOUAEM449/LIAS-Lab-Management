import { Check, X, UserPlus } from 'lucide-react';
import { Table, THead, TBody, TR, TD, TDActions } from './ui/DataTable';
import { RequestStatusBadge } from './ui/Badge';
import Button from './ui/Button';
import { TableSkeleton, EmptyState } from './ui/Feedback';

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

export default function RequestsTable({ requests, loading, actionLoadingId, canDecide = true, onApprove, onReject, onRowClick }) {
  if (loading) return <TableSkeleton rows={4} columns={5} />;

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="Aucune demande en attente"
        description="Les nouvelles candidatures soumises depuis le portail public apparaîtront ici pour validation."
      />
    );
  }

  return (
    <Table minWidth="min-w-[780px]">
      <THead
        columns={[
          'Candidat',
          "Établissement d'origine",
          'Statut demandé',
          'Soumise le',
          'État',
          { label: 'Décision', align: 'right' },
        ]}
      />
      <TBody>
        {requests.map((r) => {
          const fullName = `${r.firstName} ${r.lastName}`;
          const isPending = r.status === 'PENDING';
          const isActing = actionLoadingId === r.id;

          return (
            <TR key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              <TD>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11.5px] font-semibold shrink-0"
                    style={{ background: `oklch(58% 0.1 ${avatarHue(fullName)})` }}
                    aria-hidden="true"
                  >
                    {initialsOf(r.firstName, r.lastName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-lias-ink truncate">{fullName}</div>
                    <div className="text-[11.5px] text-lias-muted truncate">{r.email}</div>
                  </div>
                </div>
              </TD>
              <TD className="text-lias-muted">{r.homeInstitution || '—'}</TD>
              <TD className="text-lias-muted">{r.requestedStatus}</TD>
              <TD className="text-lias-muted font-mono text-[12.5px]">
                {new Date(r.submittedAt).toLocaleDateString('fr-FR')}
              </TD>
              <TD>
                <RequestStatusBadge status={r.status} size="sm" />
              </TD>
              <TDActions>
                {isPending && canDecide ? (
                  <>
                    <Button
                      size="sm"
                      icon={Check}
                      loading={isActing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprove(r.id);
                      }}
                    >
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={X}
                      disabled={isActing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(r.id);
                      }}
                    >
                      Refuser
                    </Button>
                  </>
                ) : (
                  <span className="text-[12px] text-lias-faint">{isPending ? 'En attente' : 'Décidée'}</span>
                )}
              </TDActions>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
