import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, Trash2, UserCheck, Users } from "lucide-react";
import { getUsers, updateUser, approveUser, rejectUser, deleteUser } from "../services/usersService.js";
import { getRoles, createRole, updateRole, deleteRole } from "../services/rolesService.js";
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
import RoleForm from "../components/RoleForm.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { SkeletonList } from "../components/ui/Skeleton.jsx";

const STATUS_VARIANTS = {
  pending: "pending",
  approved: "active",
  rejected: "danger",
};

const STATUS_LABELS = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", roleId: "", password: "" });
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [approveTarget, setApproveTarget] = useState(null);
  const [approveRoleId, setApproveRoleId] = useState("");
  const [approving, setApproving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [roleModal, setRoleModal] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: "", permissions: {} });
  const [roleSaving, setRoleSaving] = useState(false);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);
  const [deletingRole, setDeletingRole] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersData.users);
      setRoles(rolesData.roles);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingUsers = users.filter((u) => u.status === "pending");

  const openEdit = (user) => {
    setEditing(user);
    setEditForm({ name: user.name, roleId: user.roleId ?? "", password: "" });
    setEditErrors({});
  };

  const handleEditSave = async () => {
    const errs = {};
    if (!editForm.name.trim()) errs.name = "El nombre es requerido";
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await updateUser(editing.id, {
        name: editForm.name.trim(),
        roleId: editForm.roleId ? Number(editForm.roleId) : null,
        password: editForm.password || undefined,
      });
      setEditing(null);
      loadData();
      toast.success("Usuario actualizado");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!approveRoleId) return;
    setApproving(true);
    try {
      await approveUser(approveTarget.id, Number(approveRoleId));
      setApproveTarget(null);
      loadData();
      toast.success("Usuario aprobado");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al aprobar");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (user) => {
    try {
      await rejectUser(user.id);
      loadData();
      toast.success("Usuario rechazado");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al rechazar");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
      toast.success("Usuario eliminado");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const openCreateRole = () => {
    setRoleModal("create");
    setRoleForm({ name: "", permissions: {} });
  };

  const openEditRole = (role) => {
    setRoleModal("edit");
    setRoleForm({ id: role.id, name: role.name, permissions: role.permissions ?? {} });
  };

  const handleRoleSave = async () => {
    if (!roleForm.name.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }
    setRoleSaving(true);
    try {
      if (roleModal === "edit") {
        await updateRole(roleForm.id, { name: roleForm.name.trim(), permissions: roleForm.permissions });
        toast.success("Rol actualizado");
      } else {
        await createRole({ name: roleForm.name.trim(), permissions: roleForm.permissions });
        toast.success("Rol creado");
      }
      setRoleModal(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar el rol");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleTarget) return;
    setDeletingRole(true);
    try {
      await deleteRole(deleteRoleTarget.id);
      setDeleteRoleTarget(null);
      loadData();
      toast.success("Rol eliminado");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar el rol");
    } finally {
      setDeletingRole(false);
    }
  };

  if (currentUser?.role?.name !== "Admin") {
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
        <p className="text-sm text-slate-500">Gestión de cuentas, aprobación y roles</p>
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : (
        <>
          {pendingUsers.length > 0 && (
            <Card>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Pendientes de aprobación ({pendingUsers.length})
              </p>
              <div className="flex flex-col gap-2">
                {pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email} · {formatDate(u.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { setApproveTarget(u); setApproveRoleId(""); }}>
                        <UserCheck className="h-4 w-4" /> Aprobar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleReject(u)}>
                        <ShieldOff className="h-4 w-4" /> Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <p className="mb-3 text-sm font-semibold text-slate-800">Todos los usuarios</p>
            {users.length === 0 ? (
              <EmptyState icon={Users} title="Sin usuarios" description="No hay usuarios registrados." />
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
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {u.name}
                          {u.id === currentUser.id && (
                            <span className="ml-1 text-xs text-slate-400">(tú)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role?.name === "Admin" ? "info" : "pending"}>
                            {u.role?.name ?? "Sin rol"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_VARIANTS[u.status]}>
                            {STATUS_LABELS[u.status]}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>
                              Editar
                            </Button>
                            {u.id !== currentUser.id && (
                              <Button size="sm" variant="danger" onClick={() => setDeleteTarget(u)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">Roles</p>
              <Button size="sm" onClick={openCreateRole}>Crear rol</Button>
            </div>
            {roles.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="Sin roles" description="Crea un rol para asignar a los usuarios." />
            ) : (
              <div className="flex flex-col gap-2">
                {roles.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">{r._count?.users ?? 0} usuarios</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditRole(r)}>
                        Editar
                      </Button>
                      {(r._count?.users ?? 0) === 0 && r.name !== "Admin" && (
                        <Button size="sm" variant="danger" onClick={() => setDeleteRoleTarget(r)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Editar: ${editing?.name ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button loading={saving} onClick={handleEditSave}>Guardar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            error={editErrors.name}
          />
          <Select
            label="Rol"
            value={editForm.roleId}
            onChange={(e) => setEditForm((f) => ({ ...f, roleId: e.target.value }))}
          >
            <option value="">Sin rol</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          <Input
            type="password"
            label="Nueva contraseña (opcional)"
            value={editForm.password}
            onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Dejar vacío para no cambiar"
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title={`Aprobar: ${approveTarget?.name ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApproveTarget(null)}>Cancelar</Button>
            <Button loading={approving} disabled={!approveRoleId} onClick={handleApprove}>
              Aprobar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Selecciona el rol para <strong>{approveTarget?.name}</strong>:
          </p>
          <Select
            label="Rol"
            value={approveRoleId}
            onChange={(e) => setApproveRoleId(e.target.value)}
          >
            <option value="">Seleccionar rol...</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </div>
      </Modal>

      <Modal
        open={roleModal !== null}
        onClose={() => setRoleModal(null)}
        title={roleModal === "edit" ? `Editar rol: ${roleForm.name}` : "Crear rol"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRoleModal(null)}>Cancelar</Button>
            <Button loading={roleSaving} onClick={handleRoleSave}>Guardar</Button>
          </>
        }
      >
        <RoleForm value={roleForm} onChange={setRoleForm} />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar usuario"
        message={`¿Eliminar al usuario "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteRoleTarget)}
        title="Eliminar rol"
        message={`¿Eliminar el rol "${deleteRoleTarget?.name}"? Solo se puede eliminar si no tiene usuarios asignados.`}
        confirmLabel="Eliminar"
        loading={deletingRole}
        onConfirm={handleDeleteRole}
        onCancel={() => setDeleteRoleTarget(null)}
      />
    </div>
  );
}
