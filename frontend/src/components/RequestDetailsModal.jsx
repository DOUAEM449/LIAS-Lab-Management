import { Mail, Building2, GraduationCap, CalendarDays, FileText, Check, X } from 'lucide-react';
import Modal from './Modal';
import Button from './ui/Button';
import { RequestStatusBadge, MEMBER_STATUS_LABEL } from './ui/Badge';

function Row({ icon: Icon, label, children, block = false }) {
  return (
    <div className="flex items-start gap-3.5 py-3.5 border-b border-lias-border-light last:border-b-0">
      <div className="w-8 h-8 rounded-lg bg-lias-surface-muted flex items-center justify-center shrink-0">
        <Icon size={14} className="text-lias-faint" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-lias-faint font-semibold uppercase tracking-[0.06em]">{label}</div>
        <div className={`text-[13.5px] text-lias-ink mt-1 ${block ? 'leading-relaxed whitespace-pre-wrap' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function RequestDetailsModal({ request, onClose, canDecide = true, actionLoading, onApprove, onReject }) {
  if (!request) return null;

  const fullName = `${request.firstName} ${request.lastName}`;
  const isPending = request.status === 'PENDING';

  return (
    <Modal
      open={Boolean(request)}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={fullName}
      subtitle="Dossier de candidature"
      footer={
        isPending && canDecide ? (
          <>
            <Button
              icon={Check}
              className="flex-1"
              loading={actionLoading}
              onClick={() => onApprove(request.id)}
            >
              Accepter la candidature
            </Button>
            <Button
              variant="danger"
              icon={X}
              className="flex-1"
              disabled={actionLoading}
              onClick={() => onReject(request.id)}
            >
              Refuser
            </Button>
          </>
        ) : null
      }
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-lias-faint">État</span>
        <RequestStatusBadge status={request.status} size="sm" />
      </div>

      <Row icon={Mail} label="Adresse email">
        {request.email}
      </Row>
      <Row icon={Building2} label="Établissement d'origine">
        {request.homeInstitution || '—'}
      </Row>
      <Row icon={GraduationCap} label="Statut demandé">
        {MEMBER_STATUS_LABEL[request.requestedStatus] || request.requestedStatus}
      </Row>
      <Row icon={CalendarDays} label="Date de soumission">
        {new Date(request.submittedAt).toLocaleString('fr-FR')}
      </Row>
      <Row icon={FileText} label="Lettre de motivation" block>
        {request.motivationLetter || '—'}
      </Row>
      {request.cvOriginalName && (
        <Row icon={FileText} label="Curriculum vitae joint">
          {request.cvOriginalName}
        </Row>
      )}
      {!isPending && (
        <>
          <Row icon={CalendarDays} label="Date de décision">
            {request.decisionDate ? new Date(request.decisionDate).toLocaleString('fr-FR') : '—'}
          </Row>
          {request.decisionNote && (
            <Row icon={FileText} label="Note de décision" block>
              {request.decisionNote}
            </Row>
          )}
        </>
      )}

      {isPending && (
        <p className="text-[12px] text-lias-muted mt-4 mb-0 leading-relaxed">
          Accepter cette candidature crée le compte du membre, ouvre sa première période
          d'affiliation et lui envoie ses identifiants par email.
        </p>
      )}
    </Modal>
  );
}
