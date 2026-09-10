import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './ui/Button';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
  loading,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="flex items-start gap-3.5">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
            ${tone === 'danger' ? 'bg-lias-danger-bg' : 'bg-lias-warning-bg'}`}
        >
          <AlertTriangle
            size={18}
            className={tone === 'danger' ? 'text-lias-danger-text' : 'text-lias-warning-text'}
          />
        </div>
        <p className="text-[13.5px] text-lias-ink m-0 leading-relaxed pt-2">{message}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger-solid' : 'primary'}
          className="flex-1"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
