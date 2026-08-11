export default function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} aria-hidden="true" />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex-1">
        <Skeleton className="mb-1.5 h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
