import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, Users } from "lucide-react";
import { getUsers, updateUser } from "../services/usersService.js";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { formatDate } from "../utils/formatters.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Badge from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import { SkeletonList } from "../components/ui/Skeleton.jsx";

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", role: "seller", active: true, password: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const { users: data } = await getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, role: user.role, active: user.active, password: "" });
    setErrors({});
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "El nombre es requerido";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await updateUser(editing.id, {
        name: form.name.trim(),
        role: form.role,
        active: Boolean(form.active),
        password: form.password,
      });
      setEditing(null);
      loadUsers();
      toast.success("Usuario actualizado correctamente");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Solo los administradores pueden gestionar usuarios.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-500">Gestión de cuentas del negocio</p>
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : users.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Sin usuarios" description="No hay usuarios registrados." />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.name}
                    {user.id === currentUser.id && (
                      <span className="ml-1 text-xs text-slate-400">(tú)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "info" : "pending"}>
                      {user.role === "admin" ? "Admin" : "Vendedor"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.active ? "active" : "inactive"}>
                      {user.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(user)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Editar usuario: ${editing?.name ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button loading={saving} onClick={handleSave}>
              Guardar cambios
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name}
          />
          <Select
            label="Rol"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="seller">Vendedor</option>
            <option value="admin">Administrador</option>
          </Select>
          <Select
            label="Estado"
            value={form.active ? "true" : "false"}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "true" }))}
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Select>
          <Input
            type="password"
            label="Nueva contraseña (opcional)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Dejar vacío para no cambiar"
          />
          {form.role === "admin" && (
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <ShieldAlert className="h-4 w-4" />
              El rol admin puede acceder a la gestión de usuarios.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
