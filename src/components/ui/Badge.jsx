const variants = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-600",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-800",
};

export default function Badge({ variant = "info", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
