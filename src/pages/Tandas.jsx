import { useCallback, useEffect, useState } from "react";
import { PackagePlus, ListChecks, Ban } from "lucide-react";
import { getSaleBatches, cancelSaleBatch } from "../services/tandasService.js";
import { formatDate } from "../utils/formatters.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Modal from "../components/ui/Modal.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Badge from "../components/ui/Badge.jsx";
import FormSaleBatch from "../components/FormSaleBatch.jsx";
import CancelDialog from "../components/CancelDialog.jsx";

export default function Tandas() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      const { batches: data } = await getSaleBatches();
      setBatches(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleCreated = (warnings = []) => {
    setModalOpen(false);
    loadBatches();
    if (warnings.length > 0) {
      setNotice({ type: "warning", text: warnings.join(" · ") });
    } else {
      setNotice({ type: "success", text: "Tanda registrada correctamente" });
    }
    setTimeout(() => setNotice(null), 6000);
  };

  const handleCancel = async (reason) => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelSaleBatch(cancelTarget.id, reason);
      setCancelTarget(null);
      loadBatches();
      setNotice({ type: "success", text: `Tanda #${cancelTarget.batchNumber} cancelada` });
      setTimeout(() => setNotice(null), 6000);
    } catch (error) {
      setCancelError(error.response?.data?.message || "Error al cancelar la tanda");
    } finally {
      setCancelling(false);
    }
  };

  const totalAvailable = (productions = []) =>
    productions.reduce((acc, p) => acc + p.quantityAvailable, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tandas</h1>
          <p className="text-sm text-slate-500">Producción y disponibilidad de porciones</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PackagePlus className="h-4 w-4" /> Registrar Tanda
        </Button>
      </div>

      {notice && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.type === "warning"
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <EmptyState
            icon={ListChecks}
            title="Sin tandas registradas"
            description="Registra tu primera producción para comenzar a vender porciones."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {batches.map((batch) => {
            const isCancelled = batch.status === "cancelled";
            return (
              <Card
                key={batch.id}
                className={isCancelled ? "opacity-60" : ""}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Tanda #{batch.batchNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(batch.date)}</p>
                    {isCancelled && batch.cancelReason && (
                      <p className="mt-1 text-xs text-red-600">Motivo: {batch.cancelReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isCancelled ? "danger" : "active"}>
                      {isCancelled ? "Cancelada" : "Activa"}
                    </Badge>
                    <Badge variant="info">
                      {totalAvailable(batch.productions)} porciones disponibles
                    </Badge>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isCancelled}
                      onClick={() => {
                        setCancelTarget(batch);
                        setCancelError("");
                      }}
                    >
                      <Ban className="h-4 w-4" /> Cancelar
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {batch.productions.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-800">{prod.product.name}</span>
                      <span className="text-slate-600">
                        {prod.quantityProduced} producidas · {prod.quantityAvailable} disponibles
                      </span>
                      <span className="font-semibold text-slate-900">
                        $ {prod.unitPriceUSD} / porción
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Tanda" size="lg">
        <FormSaleBatch onSuccess={handleCreated} onClose={() => setModalOpen(false)} />
      </Modal>

      <CancelDialog
        open={Boolean(cancelTarget)}
        title={`Cancelar tanda #${cancelTarget?.batchNumber}`}
        message="La tanda, sus producciones y ventas quedarán como canceladas. No se modifican billeteras."
        consequences="Se restaurará el stock de inventario consumido y la disponibilidad de porciones."
        confirmLabel="Cancelar tanda"
        loading={cancelling}
        error={cancelError}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
