import { useEffect } from 'react';
import { X, Mail, Building2, GraduationCap, CalendarDays, FileText, Loader2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ROLE_LABEL_FR = {
  PERMANENT: 'Membre permanent',
  ASSOCIATE: 'Membre associé',
  PHD_STUDENT: 'Doctorant',
  RETIRED: 'Retraité',
  FORMER: 'Ancien membre',
};

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-lias-border-light last:border-b-0">
      <Icon size={16} className="text-lias-muted mt-0.5 shrink-0" />
      <div>
        <div className="text-[11.5px] text-lias-muted font-medium uppercase tracking-wide">
          {label}
        </div>
        <div className="text-[13.5px] text-lias-ink mt-0.5">{children}</div>
      </div>
    </div>
  );
}

export default function RequestDetailsModal({ request, onClose, actionLoading, onApprove, onReject }) {
  useEffect(() => {
    if (!request) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [request, onClose]);

  if (!request) return null;

  const fullName = `${request.firstName} ${request.lastName}`;
  const isPending = request.status === 'PENDING';

  return (
    <div
      className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-lias-border-light sticky top-0 bg-white">
          <div>
            <h3 className="m-0 text-base font-semibold text-lias-navy">{fullName}</h3>
            <div className="mt-1">
              <StatusBadge status={request.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-lias-muted hover:text-lias-ink p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-2">
          <Row icon={Mail} label="Email">
            {request.email}
          </Row>
          <Row icon={Building2} label="Établissement d'origine">
            {request.homeInstitution || '—'}
          </Row>
          <Row icon={GraduationCap} label="Statut demandé">
            {ROLE_LABEL_FR[request.requestedStatus] || request.requestedStatus}
          </Row>
          <Row icon={CalendarDays} label="Date de soumission">
            {new Date(request.submittedAt).toLocaleString('fr-FR')}
          </Row>
          <Row icon={FileText} label="Lettre de motivation">
            {request.motivationLetter || '—'}
          </Row>
          {request.cvOriginalName && (
            <Row icon={FileText} label="CV joint">
              {request.cvOriginalName}
            </Row>
          )}
          {request.status !== 'PENDING' && request.decisionNote && (
            <Row icon={FileText} label="Note de décision">
              {request.decisionNote}
            </Row>
          )}
        </div>

        {isPending && (
          <div className="flex gap-3 px-6 py-4 border-t border-lias-border-light">
            <button
              onClick={() => onApprove(request.id)}
              disabled={actionLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {actionLoading && <Loader2 size={15} className="animate-spin" />}
              Accepter
            </button>
            <button
              onClick={() => onReject(request.id)}
              disabled={actionLoading}
              className="flex-1 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refuser
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
