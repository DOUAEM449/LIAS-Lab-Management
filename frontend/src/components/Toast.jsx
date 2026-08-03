import { useCallback, useRef, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

let nextId = 1;

// Minimal local toast stack — no external dependency. Each page that wants
// toasts calls useToasts() and renders <ToastStack toasts={...} onDismiss={...} />.
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (type, message, duration = 4000) => {
      const id = nextId++;
      setToasts((t) => [...t, { id, type, message }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return {
    toasts,
    dismiss,
    success: (message) => push('success', message),
    error: (message) => push('error', message),
  };
}

export function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 shadow-lg text-sm ${
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          ) : (
            <XCircle size={18} className="shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="bg-transparent border-none cursor-pointer text-current opacity-60 hover:opacity-100"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
