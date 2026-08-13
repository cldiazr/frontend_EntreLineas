import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingCart, Ban } from "lucide-react";
import { getSaleBatches } from "../services/tandasService.js";
import { getProducts } from "../services/productsService.js";
import { getSales, cancelSale } from "../services/salesService.js";
import { formatDate, formatUSD } from "../utils/formatters.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Modal from "../components/ui/Modal.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Badge from "../components/ui/Badge.jsx";
import FormSale from "../components/FormSale.jsx";
import CancelDialog from "../components/CancelDialog.jsx";

export default function Ventas() {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    customerName: "",
    productId: "",
    dateFrom: "",
    dateTo: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [{ batches: batchData }, { products: productData }, salesData] =
        await Promise.all([getSaleBatches(), getProducts(), getSales()]);
      setBatches(batchData);
      setProducts(productData);
      setSales(salesData.sales);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableProductions = useMemo(() => {
    return batches.flatMap((batch) =>
      batch.status === "cancelled"
        ? []
        : batch.productions
            .filter((p) => p.status !== "cancelled" && p.quantityAvailable > 0)
            .map((p) => ({
              id: p.id,
              label: `Tanda #${batch.batchNumber} · ${p.product.name} · $${p.unitPriceUSD} · ${p.quantityAvailable} disp.`,
              batchNumber: batch.batchNumber,
              productName: p.product.name,
              unitPriceUSD: p.unitPriceUSD,
              quantityAvailable: p.quantityAvailable,
            }))
    );
  }, [batches]);

  const applyFilters = useCallback(async () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.customerName) params.customerName = filters.customerName;
    if (filters.productId) params.productId = filters.productId;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    const { sales: data } = await getSales(params);
    setSales(data);
  }, [filters]);

  const handleCreated = () => {
    setModalOpen(false);
    loadData();
    setNotice({ type: "success", text: "Venta registrada correctamente" });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCancel = async (reason) => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelSale(cancelTarget.id, reason);
      setCancelTarget(null);
      loadData();
      setNotice({ type: "success", text: "Venta cancelada correctamente" });
      setTimeout(() => setNotice(null), 4000);
    } catch (error) {
      setCancelError(error.response?.data?.message || "Error al cancelar la venta");
    } finally {
      setCancelling(false);
    }
  };

  const resetFilters = () => {
    setFilters({ status: "", customerName: "", productId: "", dateFrom: "", dateTo: "" });
    loadData();
  };

  const statusBadge = (status) => {
    if (status === "paid") return { variant: "paid", label: "Pagada" };
    if (status === "cancelled") return { variant: "danger", label: "Cancelada" };
    return { variant: "pending", label: "Pendiente" };
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
          <p className="text-sm text-slate-500">Registrar ventas contra tandas disponibles</p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={availableProductions.length === 0}>
          <ShoppingCart className="h-4 w-4" /> Registrar Venta
        </Button>
      </div>

      {availableProductions.length === 0 && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          No hay producciones con disponibilidad. Registra una tanda primero.
        </div>
      )}

      {notice && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice.text}
        </div>
      )}

      <Card>
        <p className="mb-3 text-sm font-semibold text-slate-800">Filtros</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Estado"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Cancelada</option>
          </Select>
          <Input
            label="Cliente"
            value={filters.customerName}
            onChange={(e) => setFilters((f) => ({ ...f, customerName: e.target.value }))}
            placeholder="María"
          />
          <Select
            label="Producto"
            value={filters.productId}
            onChange={(e) => setFilters((f) => ({ ...f, productId: e.target.value }))}
          >
            <option value="">Todos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
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
      ) : sales.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingCart}
            title="Sin ventas"
            description="Las ventas aparecerán aquí cuando las registres."
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Tanda</th>
                <th className="px-4 py-3 text-right">Cant.</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-right">Total USD</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => {
                const isCancelled = sale.status === "cancelled";
                const badge = statusBadge(sale.status);
                return (
                  <tr
                    key={sale.id}
                    className={isCancelled ? "opacity-50 hover:bg-slate-50" : "hover:bg-slate-50"}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{sale.customerName}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {sale.batchProduction?.product?.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      #{sale.batchProduction?.batch?.batchNumber}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{sale.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatUSD(sale.unitPriceUSD)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatUSD(sale.totalUSD)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isCancelled && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setCancelTarget(sale);
                            setCancelError("");
                          }}
                        >
                          <Ban className="h-4 w-4" /> Cancelar
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Venta" size="lg">
        <FormSale
          productions={availableProductions}
          onSuccess={handleCreated}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      <CancelDialog
        open={Boolean(cancelTarget)}
        title="Cancelar venta"
        message={`¿Cancelar la venta a ${cancelTarget?.customerName ?? ""} por ${
          cancelTarget ? formatUSD(cancelTarget.totalUSD) : ""
        }?`}
        consequences="Se restaurará la disponibilidad de la producción. No se modifican billeteras."
        confirmLabel="Cancelar venta"
        loading={cancelling}
        error={cancelError}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
