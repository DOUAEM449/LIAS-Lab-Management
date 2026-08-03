import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, title, subtitle, onClose, children, footer, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-lias-border-light sticky top-0 bg-white z-10">
          <div>
            <h3 className="m-0 text-base font-semibold text-lias-navy">{title}</h3>
            {subtitle && <p className="m-0 mt-1 text-xs text-lias-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-lias-muted hover:text-lias-ink p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4">{children}</div>

        {footer && (
          <div className="flex gap-3 px-6 py-4 border-t border-lias-border-light">{footer}</div>
        )}
      </div>
    </div>
  );
}
