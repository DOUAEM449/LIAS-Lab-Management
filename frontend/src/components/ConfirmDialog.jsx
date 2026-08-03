import { Loader2, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', loading, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel} maxWidth="max-w-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-lias-danger-bg flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-lias-danger-text" />
        </div>
        <p className="text-sm text-lias-ink m-0">{message}</p>
      </div>
      <div className="flex gap-3 mt-5">
        <button
          onClick={onCancel}
          className="flex-1 bg-white border border-lias-border rounded-lg py-2.5 text-sm font-medium cursor-pointer text-lias-ink"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-none rounded-lg py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
