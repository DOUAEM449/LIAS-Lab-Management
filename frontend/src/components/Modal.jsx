import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, title, subtitle, onClose, children, footer, maxWidth = 'max-w-lg' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);

    // Lock the page behind the dialog so the background does not scroll away.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog for keyboard and screen-reader users.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-lias-navy-deep/45 backdrop-blur-[2px] z-40 flex items-start sm:items-center
        justify-center p-4 overflow-y-auto lias-overlay-enter"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`bg-lias-surface rounded-card shadow-overlay w-full ${maxWidth} my-auto
          max-h-[92vh] overflow-y-auto outline-none lias-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-lias-border-light sticky top-0 bg-lias-surface z-10">
          <div className="min-w-0">
            <h3 className="m-0 text-[15px] font-semibold text-lias-navy">{title}</h3>
            {subtitle && <p className="m-0 mt-1 text-[12.5px] text-lias-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="bg-transparent border-none cursor-pointer text-lias-faint hover:text-lias-ink p-1 -mr-1
              rounded-md transition-colors duration-150 shrink-0"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex gap-3 px-6 py-4 border-t border-lias-border-light bg-lias-surface-muted/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
