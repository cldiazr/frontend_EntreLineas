import { useCallback, useEffect, useState } from "react";
import { Ban, Wallet } from "lucide-react";
import { getInventory } from "../services/inventoryService.js";
import {
  getInventoryPurchases,
  cancelInventoryPurchase,
} from "../services/purchasesService.js";
import { useWallet } from "../hooks/useWallet.js";
import { formatDate, formatVES } from "../utils/formatters.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import FormPurchase from "../components/FormPurchase.jsx";
import CancelDialog from "../components/CancelDialog.jsx";

export default function Gastos() {
  const { refreshWallets } = useWallet();
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [filters, setFilters] = useState({ itemId: "", supplier: "", dateFrom: "", dateTo: "" });

  const loadData = useCallback(async () => {
    try {
      const [{ items: itemData }, { purchases: purchaseData }] = await Promise.all([
        getInventory(),
        getInventoryPurchases(),
      ]);
      setItems(itemData);
      setPurchases(purchaseData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFilters = useCallback(async () => {
    const params = {};
    if (filters.itemId) params.itemId = filters.itemId;
    if (filters.supplier) params.supplier = filters.supplier;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    const { purchases: data } = await getInventoryPurchases(params);
    setPurchases(data);
  }, [filters]);

  const handleCreated = () => {
    refreshWallets();
    loadData();
    setNotice({ type: "success", text: "Compra registrada: se debitó la billetera VES y aumentó el stock" });
    setTimeout(() => setNotice(null), 5000);
  };

  const handleCancel = async (reason) => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelInventoryPurchase(cancelTarget.id, reason);
      setCancelTarget(null);
      refreshWallets();
      loadData();
      setNotice({ type: "success", text: "Compra cancelada: se devolvió el monto a la billetera VES" });
      setTimeout(() => setNotice(null), 5000);
    } catch (error) {
      setCancelError(error.response?.data?.message || "Error al cancelar la compra");
    } finally {
      setCancelling(false);
    }
  };

  const resetFilters = () => {
    setFilters({ itemId: "", supplier: "", dateFrom: "", dateTo: "" });
    loadData();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gastos</h1>
        <p className="text-sm text-slate-500">Compras de inventario</p>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice.text}
        </div>
      )}

      <Card>
        <p className="mb-4 text-sm font-semibold text-slate-800">Registrar compra</p>
        <FormPurchase items={items} onSuccess={handleCreated} />
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold text-slate-800">Filtros de historial</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Item"
            value={filters.itemId}
            onChange={(e) => setFilters((f) => ({ ...f, itemId: e.target.value }))}
          >
            <option value="">Todos</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Input
            label="Proveedor"
            value={filters.supplier}
            onChange={(e) => setFilters((f) => ({ ...f, supplier: e.target.value }))}
            placeholder="Proveedor"
          />
          <Input
            type="date"
            label="Desde"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          />
          <Input
            type="date"
            label="Hasta"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={applyFilters}>
            Aplicar filtros
          </Button>
          <Button size="sm" variant="secondary" onClick={resetFilters}>
            Limpiar
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : purchases.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="Sin compras registradas"
            description="Las compras de inventario aparecerán aquí."
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-right">Cant.</th>
                <th className="px-4 py-3 text-right">P. unitario</th>
                <th className="px-4 py-3 text-right">Total VES</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className={purchase.status === "cancelled" ? "opacity-50 hover:bg-slate-50" : "hover:bg-slate-50"}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(purchase.purchaseDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {purchase.item?.name}
                    <span className="ml-1 text-xs text-slate-400">({purchase.item?.unit})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{purchase.supplier || "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{purchase.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatVES(purchase.unitPriceVES)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatVES(purchase.totalVES)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {purchase.status === "cancelled" ? (
                      <Badge variant="danger">Cancelada</Badge>
                    ) : (
                      <Badge variant="active">Activa</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {purchase.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setCancelTarget(purchase)}
                      >
                        <Ban className="h-4 w-4" /> Cancelar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CancelDialog
        open={Boolean(cancelTarget)}
        title="Cancelar compra"
        message={
          cancelTarget
            ? `¿Cancelar la compra de ${cancelTarget.quantity} ${cancelTarget.item?.name ?? ""} por ${formatVES(cancelTarget.totalVES)}?`
            : ""
        }
        consequences="Se devolverá el total VES a la billetera y se reducirá el stock del inventario."
        confirmLabel="Cancelar compra"
        loading={cancelling}
        error={cancelError}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
