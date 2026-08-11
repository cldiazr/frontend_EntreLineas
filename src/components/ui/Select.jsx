export default function Select({
  label,
  error,
  className = "",
  id,
  children,
  ...props
}) {
  const selectId = id || props.name || label;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-300"
            : "border-slate-300 focus:ring-amber-300"
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
