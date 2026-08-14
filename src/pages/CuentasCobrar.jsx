import { useCallback, useEffect, useState } from "react";
import { Eye, HandCoins } from "lucide-react";
import {
  getSales,
  getPayments,
  cancelPayment,
  cancelSale,
} from "../services/salesService.js";
import { useWallet } from "../hooks/useWallet.js";
import { formatDate, formatVES, formatUSD } from "../utils/formatters.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import FormPayment from "../components/FormPayment.jsx";
import CancelDialog from "../components/CancelDialog.jsx";

export default function CuentasCobrar() {
  const { refreshWallets } = useWallet();
  const [sales, setSales] = useState([]);
  const [totalPendingUSD, setTotalPendingUSD] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentFor, setPaymentFor] = useState(null);
  const [viewPaymentsFor, setViewPaymentsFor] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelSaleTarget, setCancelSaleTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [notice, setNotice] = useState(null);

  const showNotice = (text) => {
    setNotice({ type: "success", text });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadPending = useCallback(async () => {
    try {
      const { sales: data } = await getSales({ status: "pending" });
      const withRemaining = await Promise.all(
        data.map(async (sale) => {
          const { payments } = await getPayments(sale.id);
          const activePayments = payments.filter((p) => p.status === "active");
          const paidUSD = activePayments.reduce((acc, p) => acc + p.amountUSD, 0);
          return {
            ...sale,
            payments,
            activePayments,
            paidUSD,
            remainingUSD: Math.max(0, sale.totalUSD - paidUSD),
          };
        })
      );
      setSales(withRemaining);
      setTotalPendingUSD(withRemaining.reduce((acc, s) => acc + s.remainingUSD, 0));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handlePaid = () => {
    setPaymentFor(null);
    refreshWallets();
    loadPending();
    showNotice("Pago registrado y billetera VES actualizada");
  };

  const handlePaymentCancelled = async (reason) => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelPayment(cancelTarget.saleId, cancelTarget.id, reason);
      setCancelTarget(null);
      refreshWallets();
      loadPending();
      showNotice("Pago cancelado: se revirtió la billetera VES");
    } catch (error) {
      setCancelError(error.response?.data?.message || "Error al cancelar el pago");
    } finally {
      setCancelling(false);
    }
  };

  const handleSaleCancelled = async (reason) => {
    if (!cancelSaleTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelSale(cancelSaleTarget.id, reason);
      setCancelSaleTarget(null);
      loadPending();
      showNotice("Venta cancelada: disponibilidad restaurada");
    } catch (error) {
      setCancelError(error.response?.data?.message || "Error al cancelar la venta");
    } finally {
      setCancelling(false);
    }
  };

  const hasActivePayments = (sale) => (sale.activePayments?.length ?? 0) > 0;

  const paymentStatusBadge = (status) =>
    status === "cancelled" ? (
      <Badge variant="danger">Cancelado</Badge>
    ) : (
      <Badge variant="active">Activo</Badge>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cuentas por Cobrar</h1>
          <p className="text-sm text-slate-500">Ventas pendientes de cobro</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-right">
          <p className="text-xs font-medium text-amber-700">Total pendiente</p>
          <p className="text-2xl font-bold text-amber-900">{formatUSD(totalPendingUSD)}</p>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : sales.length === 0 ? (
        <Card>
          <EmptyState
            icon={HandCoins}
            title="Sin cuentas por cobrar"
            description="No tienes ventas pendientes. Todo está cobrado."
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
                <th className="px-4 py-3 text-right">Total USD</th>
                <th className="px-4 py-3 text-right">Pagado</th>
                <th className="px-4 py-3 text-right">Pendiente</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(sale.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{sale.customerName}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {sale.batchProduction?.product?.name}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {formatUSD(sale.totalUSD)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700">
                    {formatUSD(sale.paidUSD)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-700">
                    {formatUSD(sale.remainingUSD)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="pending">Pendiente</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setViewPaymentsFor(sale)}>
                        <Eye className="h-4 w-4" /> Ver pagos
                      </Button>
                      <Button size="sm" onClick={() => setPaymentFor(sale)}>
                        Registrar Pago
                      </Button>
                      {!hasActivePayments(sale) && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setCancelSaleTarget(sale)}
                        >
                          Cancelar venta
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

      <Modal
        open={Boolean(paymentFor)}
        onClose={() => setPaymentFor(null)}
        title="Registrar Pago"
      >
        {paymentFor && (
          <FormPayment
            sale={paymentFor}
            remainingUSD={paymentFor.remainingUSD}
            onSuccess={handlePaid}
            onClose={() => setPaymentFor(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewPaymentsFor)}
        onClose={() => setViewPaymentsFor(null)}
        title={`Pagos de ${viewPaymentsFor?.customerName ?? ""}`}
        size="lg"
      >
        {viewPaymentsFor && (
          <div className="flex flex-col gap-3">
            {viewPaymentsFor.payments.length === 0 ? (
              <p className="text-sm text-slate-500">Esta venta no tiene pagos registrados.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2 text-right">Monto VES</th>
                      <th className="px-3 py-2 text-right">Tasa</th>
                      <th className="px-3 py-2 text-right">Equivale</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewPaymentsFor.payments.map((p) => (
                      <tr
                        key={p.id}
                        className={p.status === "cancelled" ? "opacity-50" : ""}
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                          {formatDate(p.date)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">
                          {formatVES(p.amountVES)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {Number(p.rateVESPerUSD).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">
                          {formatUSD(p.amountUSD)}
                        </td>
                        <td className="px-3 py-2 text-center">{paymentStatusBadge(p.status)}</td>
                        <td className="px-3 py-2 text-right">
                          {p.status === "active" && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setCancelTarget({ ...p, saleId: viewPaymentsFor.id })}
                            >
                              Cancelar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-slate-500">
              Cancelar un pago revierte el monto de la billetera VES y recalcula el estado de la
              venta (pasa a pendiente si el total pagado deja de cubrirla).
            </p>
          </div>
        )}
      </Modal>

      <CancelDialog
        open={Boolean(cancelTarget)}
        title="Cancelar pago"
        message={`¿Cancelar el pago de ${formatVES(cancelTarget?.amountVES ?? 0)} del cliente ${
          viewPaymentsFor?.customerName ?? ""
        }?`}
        consequences="Se revertirá el monto en la billetera VES y se recalculará el estado de la venta."
        confirmLabel="Cancelar pago"
        loading={cancelling}
        error={cancelError}
        onConfirm={handlePaymentCancelled}
        onCancel={() => setCancelTarget(null)}
      />

      <CancelDialog
        open={Boolean(cancelSaleTarget)}
        title="Cancelar venta"
        message={`¿Cancelar la venta a ${cancelSaleTarget?.customerName ?? ""} por ${formatUSD(
          cancelSaleTarget?.totalUSD ?? 0
        )}?`}
        consequences="La venta no tiene pagos activos. Se restaurará la disponibilidad de la producción."
        confirmLabel="Cancelar venta"
        loading={cancelling}
        error={cancelError}
        onConfirm={handleSaleCancelled}
        onCancel={() => setCancelSaleTarget(null)}
      />
    </div>
  );
}
