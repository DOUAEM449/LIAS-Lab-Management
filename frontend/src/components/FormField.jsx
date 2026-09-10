/*
 * Form primitives. Every input in LIAS goes through these so labels, spacing,
 * focus, error and helper text behave identically everywhere.
 */

const base =
  'w-full px-3 py-2.5 border rounded-lg text-[13.5px] outline-none bg-lias-surface text-lias-ink ' +
  'placeholder:text-lias-faint transition-colors duration-150 ' +
  'disabled:bg-lias-surface-muted disabled:text-lias-muted disabled:cursor-not-allowed';

function inputClass(error) {
  return `${base} ${
    error
      ? 'border-lias-danger focus:border-lias-danger'
      : 'border-lias-border hover:border-lias-border-strong focus:border-lias-blue'
  }`;
}

function Wrapper({ label, required, error, hint, children }) {
  return (
    <label className="block mb-4">
      {label && (
        <span className="block text-[12px] font-semibold text-lias-ink-soft mb-1.5">
          {label} {required && <span className="text-lias-danger-text">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-[11.5px] text-lias-danger-text mt-1.5">{error}</span>
      ) : (
        hint && <span className="block text-[11.5px] text-lias-muted mt-1.5">{hint}</span>
      )}
    </label>
  );
}

export function TextField({ label, required, error, hint, ...props }) {
  return (
    <Wrapper label={label} required={required} error={error} hint={hint}>
      <input className={inputClass(error)} required={required} aria-invalid={Boolean(error)} {...props} />
    </Wrapper>
  );
}

export function TextAreaField({ label, required, error, hint, rows = 3, ...props }) {
  return (
    <Wrapper label={label} required={required} error={error} hint={hint}>
      <textarea
        className={`${inputClass(error)} resize-y leading-relaxed`}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </Wrapper>
  );
}

export function SelectField({ label, required, error, hint, children, ...props }) {
  return (
    <Wrapper label={label} required={required} error={error} hint={hint}>
      <select className={`${inputClass(error)} cursor-pointer`} required={required} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

export function FileField({ label, required, error, hint, ...props }) {
  return (
    <Wrapper label={label} required={required} error={error} hint={hint}>
      <input
        type="file"
        className={`${inputClass(error)} py-2 cursor-pointer
          file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[12px]
          file:font-semibold file:bg-lias-blue-tint-solid file:text-lias-blue-dark file:cursor-pointer`}
        required={required}
        {...props}
      />
    </Wrapper>
  );
}

/** Two-column grid for side-by-side fields inside a form. */
export function FieldRow({ children, className = '' }) {
  return <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 ${className}`}>{children}</div>;
}
