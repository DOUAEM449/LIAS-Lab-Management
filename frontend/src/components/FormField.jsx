const baseClass =
  'w-full px-3 py-2.5 border border-lias-border rounded-lg text-sm outline-none focus:border-lias-blue bg-white';

export function TextField({ label, required, ...props }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-medium text-lias-muted mb-1.5">
        {label} {required && <span className="text-lias-danger-text">*</span>}
      </span>
      <input className={baseClass} required={required} {...props} />
    </label>
  );
}

export function TextAreaField({ label, required, rows = 3, ...props }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-medium text-lias-muted mb-1.5">
        {label} {required && <span className="text-lias-danger-text">*</span>}
      </span>
      <textarea className={baseClass} rows={rows} required={required} {...props} />
    </label>
  );
}

export function SelectField({ label, required, children, ...props }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-medium text-lias-muted mb-1.5">
        {label} {required && <span className="text-lias-danger-text">*</span>}
      </span>
      <select className={baseClass} required={required} {...props}>
        {children}
      </select>
    </label>
  );
}

export function FileField({ label, required, ...props }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-medium text-lias-muted mb-1.5">
        {label} {required && <span className="text-lias-danger-text">*</span>}
      </span>
      <input type="file" className={`${baseClass} py-2 cursor-pointer`} required={required} {...props} />
    </label>
  );
}
