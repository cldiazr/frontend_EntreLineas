import { useCallback, useEffect, useState } from "react";
import { Percent, Trash2 } from "lucide-react";
import {
  getCommissionPresets,
  createCommissionPreset,
  deleteCommissionPreset,
} from "../services/commissionPresetsService.js";
import { useToast } from "../hooks/useToast.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Badge from "../components/ui/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { SkeletonList } from "../components/ui/Skeleton.jsx";

export default function Comisiones() {
  const toast = useToast();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadPresets = useCallback(async () => {
    try {
      const { presets: data } = await getCommissionPresets();
      setPresets(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = "El nombre es requerido";
    if (percentage === "" || Number(percentage) < 0) errs.percentage = "Porcentaje inválido";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCreating(true);
    try {
      await createCommissionPreset({
        name: name.trim(),
        percentage: Number(percentage),
      });
      setName("");
      setPercentage("");
      loadPresets();
      toast.success("Preset de comisión creado");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al crear el preset");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCommissionPreset(deleteTarget.id);
      setDeleteTarget(null);
      loadPresets();
      toast.success("Preset eliminado");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar el preset");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Comisiones</h1>
        <p className="text-sm text-slate-500">Presets de comisión para conversiones</p>
      </div>

      <Card>
        <p className="mb-4 text-sm font-semibold text-slate-800">Crear preset</p>
        <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end" noValidate>
          <div className="flex-1">
            <Input
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="DolarToday"
              error={errors.name}
            />
          </div>
          <div className="w-full sm:w-40">
            <Input
              type="number"
              min="0"
              step="0.01"
              label="Porcentaje (%)"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="3"
              error={errors.percentage}
            />
          </div>
          <Button type="submit" loading={creating}>
            Crear preset
          </Button>
        </form>
      </Card>

      {loading ? (
        <SkeletonList rows={3} />
      ) : presets.length === 0 ? (
        <Card>
          <EmptyState
            icon={Percent}
            title="Sin presets de comisión"
            description="Crea un preset para usarlo en las conversiones."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {presets.map((preset) => (
            <Card key={preset.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{preset.name}</p>
                  <Badge variant="info">{preset.percentage}%</Badge>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteTarget(preset)}
              >
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar preset"
        message={`¿Eliminar el preset "${deleteTarget?.name}" (${deleteTarget?.percentage}%)? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
