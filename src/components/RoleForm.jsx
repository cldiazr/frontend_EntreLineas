const MODULES = [
  { key: "dashboard", label: "Dashboard", actions: ["read"] },
  { key: "tandas", label: "Tandas", actions: ["read", "create", "cancel"] },
  { key: "ventas", label: "Ventas", actions: ["read", "create", "cancel"] },
  { key: "cuentasCobrar", label: "Cuentas por Cobrar", actions: ["read", "createPayment", "cancelPayment"] },
  { key: "inventario", label: "Inventario", actions: ["read", "create", "update"] },
  { key: "recetas", label: "Recetas", actions: ["read", "create", "update"] },
  { key: "gastos", label: "Gastos", actions: ["read", "create", "cancel"] },
  { key: "conversiones", label: "Conversiones", actions: ["read", "create", "cancel"] },
  { key: "comisiones", label: "Comisiones", actions: ["read", "create", "delete"] },
  { key: "usuarios", label: "Usuarios", actions: ["read", "create", "update", "approve"] },
];

const ACTION_LABELS = {
  read: "Leer",
  create: "Crear",
  cancel: "Cancelar",
  update: "Actualizar",
  delete: "Eliminar",
  createPayment: "Registrar Pago",
  cancelPayment: "Cancelar Pago",
  approve: "Aprobar",
};

export { MODULES, ACTION_LABELS };

export default function RoleForm({ value, onChange }) {
  const name = value?.name ?? "";
  const permissions = value?.permissions ?? {};

  const setName = (newName) => {
    onChange({ ...value, name: newName });
  };

  const togglePermission = (moduleKey, action) => {
    const current = permissions[moduleKey] ?? [];
    const updated = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    onChange({
      ...value,
      permissions: { ...permissions, [moduleKey]: updated },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del rol</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Vendedor"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div className="flex flex-col gap-3">
        {MODULES.map((mod) => (
          <div key={mod.key}>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{mod.label}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {mod.actions.map((action) => {
                const checked = (permissions[mod.key] ?? []).includes(action);
                return (
                  <label
                    key={action}
                    className="flex items-center gap-1.5 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(mod.key, action)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    {ACTION_LABELS[action] ?? action}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
