import { useCallback, useEffect, useState } from "react";
import { HandCoins } from "lucide-react";
import { getSales, getPayments } from "../services/salesService.js";
import { useWallet } from "../hooks/useWallet.js";
import { formatDate, formatUSD } from "../utils/formatters.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import FormPayment from "../components/FormPayment.jsx";

export default function CuentasCobrar() {
  const { refreshWallets } = useWallet();
  const [sales, setSales] = useState([]);
  const [totalPendingUSD, setTotalPendingUSD] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentFor, setPaymentFor] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadPending = useCallback(async () => {
    try {
      const { sales: data, totalPendingUSD: total } = await getSales({ status: "pending" });
      const withRemaining = await Promise.all(
        data.map(async (sale) => {
          const { payments } = await getPayments(sale.id);
          const paidUSD = payments.reduce((acc, p) => acc + p.amountUSD, 0);
          return {
            ...sale,
            paidUSD,
            remainingUSD: Math.max(0, sale.totalUSD - paidUSD),
          };
        })
      );
      setSales(withRemaining);
      setTotalPendingUSD(total);
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
    setNotice({ type: "success", text: "Pago registrado y billetera VES actualizada" });
    setTimeout(() => setNotice(null), 4000);
  };

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
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" onClick={() => setPaymentFor(sale)}>
                      Registrar Pago
                    </Button>
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
    </div>
  );
}
