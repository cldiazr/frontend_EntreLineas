export default function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}
