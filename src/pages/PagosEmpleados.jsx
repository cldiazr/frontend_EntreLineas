import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Banknote, Coins, PiggyBank, Send } from "lucide-react";
import {
  createEmployeePayment,
  getEmployeePayments,
  cancelEmployeePayment,
} from "../services/employeePaymentsService.js";
import { getApprovedUsers } from "../services/usersService.js";
import { getDashboardSummary } from "../services/dashboardService.js";
import { useWallet } from "../hooks/useWallet.js";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { formatDate, formatUSD, formatVES } from "../utils/formatters.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Textarea from "../components/ui/Textarea.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import CancelDialog from "../components/CancelDialog.jsx";
import { SkeletonList } from "../components/ui/Skeleton.jsx";

export default function PagosEmpleados() {
  const { ves, usd, officialRate, refreshWallets } = useWallet();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [usersError, setUsersError] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    currency: "VES",
    amount: "",
    rate: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const canCreate = hasPermission("pagosEmpleados", "create");
  const canCancel = hasPermission("pagosEmpleados", "cancel");

  const loadData = useCallback(async () => {
    try {
      const { payments: paymentData } = await getEmployeePayments();
      setPayments(paymentData);
    } catch {
      setLoadError("No se pudieron cargar los pagos.");
    } finally {
      setLoading(false);
    }

    try {
      const { users: allUsers } = await getApprovedUsers();
      setUsers(allUsers ?? []);
    } catch {
      setUsersError(true);
    }

    try {
      const data = await getDashboardSummary();
      setSummary(data.summary);
    } catch {
      // las tarjetas quedan en 0
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!form.rate && officialRate) setForm((f) => ({ ...f, rate: String(officialRate) }));
  }, [form.rate, officialRate]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => ({ ...e, [key]: undefined }));
  };

  const equivalent = useMemo(() => {
    const amount = Number(form.amount);
    const rate = Number(form.rate);
    if (amount <= 0 || rate <= 0) return null;
    if (form.currency === "VES") {
      return { usd: amount / rate, ves: null };
    }
    return { usd: null, ves: amount * rate };
  }, [form.amount, form.rate, form.currency]);

  const currentMonth = summary?.month ?? new Date().toISOString().slice(0, 7);
  const monthPayments = payments.filter(
    (p) => p.status === "active" && p.date?.slice(0, 7) === currentMonth
  );

  const amountValue = Number(form.amount) || 0;
  const walletAvailable = form.currency === "VES" ? ves : usd;
  const saldoOk = walletAvailable >= amountValue;

  const handleSubmit = async () => {
    const errs = {};
    if (!form.userId) errs.userId = "Selecciona un empleado";
    if (amountValue <= 0) errs.amount = "El monto debe ser mayor a 0";
    if (!(Number(form.rate) > 0)) errs.rate = "La tasa debe ser mayor a 0";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await createEmployeePayment({
        userId: Number(form.userId),
        currency: form.currency,
        amount: amountValue,
        rateVESPerUSD: Number(form.rate),
        notes: form.notes.trim() || undefined,
      });
      refreshWallets();
      loadData();
      setField("amount", "");
      setField("notes", "");
      toast.success("Pago registrado y billetera debitada");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al registrar el pago");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPayment = async (reason) => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelEmployeePayment(cancelTarget.id, reason);
      setCancelTarget(null);
      refreshWallets();
      loadData();
      toast.success("Pago cancelado y billetera restaurada");
    } catch (error) {
      setCancelError(error.response?.data?.message || "Error al cancelar el pago");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pagos a Empleados</h1>
        <p className="text-sm text-slate-500">
          Distribución de ganancias. No afecta los índices del dashboard.
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Pagado este mes</p>
            <Banknote className="h-5 w-5 text-violet-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatUSD(summary?.totalEmployeePaymentsUSD)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Retenido en negocio</p>
            <PiggyBank className="h-5 w-5 text-teal-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatUSD(summary?.retainedProfitUSD)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Pagos este mes</p>
            <Coins className="h-5 w-5 text-sky-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{monthPayments.length}</p>
        </Card>
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : (
        <>
          {canCreate && (
            <Card>
              <p className="mb-4 text-sm font-semibold text-slate-800">Registrar pago</p>

              {usersError && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  No se pudo cargar la lista de empleados. Contacta a un administrador.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="Empleado"
                  value={form.userId}
                  onChange={(e) => setField("userId", e.target.value)}
                  error={formErrors.userId}
                >
                  <option value="">Seleccionar empleado...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">Moneda</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={form.currency === "VES" ? "primary" : "secondary"}
                      onClick={() => setField("currency", "VES")}
                    >
                      VES
                    </Button>
                    <Button
                      size="sm"
                      variant={form.currency === "USD" ? "primary" : "secondary"}
                      onClick={() => setField("currency", "USD")}
                    >
                      USD
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-500">Saldo disponible</span>
                    <span className={`font-semibold ${saldoOk ? "text-emerald-700" : "text-slate-900"}`}>
                      {form.currency === "VES" ? formatVES(walletAvailable) : formatUSD(walletAvailable)}
                    </span>
                  </div>
                </div>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  label={`Monto en ${form.currency}`}
                  value={form.amount}
                  onChange={(e) => setField("amount", e.target.value)}
                  placeholder={form.currency === "VES" ? "0.00" : "0.00"}
                  error={formErrors.amount}
                />

                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  label="Tasa (Bs. por USD)"
                  value={form.rate}
                  onChange={(e) => setField("rate", e.target.value)}
                  placeholder={officialRate ? String(officialRate) : "0.00"}
                  error={formErrors.rate}
                />

                <div className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Equivalente</span>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {form.currency === "VES"
                      ? `≈ ${formatUSD(equivalent?.usd ?? 0)}`
                      : `≈ ${formatVES(equivalent?.ves ?? 0)}`}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Notas (opcional)"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Detalle del pago..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button loading={submitting} onClick={handleSubmit}>
                  <Send className="h-4 w-4" /> Registrar pago
                </Button>
              </div>
            </Card>
          )}

          <Card>
            <p className="mb-3 text-sm font-semibold text-slate-800">Historial</p>
            {payments.length === 0 ? (
              <EmptyState
                icon={Banknote}
                title="Sin pagos"
                description="Aún no se han registrado pagos a empleados."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Empleado</th>
                      <th className="px-4 py-3">Moneda</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">USD equiv.</th>
                      <th className="px-4 py-3">Notas</th>
                      <th className="px-4 py-3">Estado</th>
                      {canCancel && <th className="px-4 py-3 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatDate(p.date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {p.user?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={p.currency === "VES" ? "info" : "paid"}>
                            {p.currency}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          {p.currency === "VES" ? formatVES(p.amountVES) : formatUSD(p.amountUSD)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatUSD(p.amountUSD)}</td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">
                          {p.notes || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={p.status === "active" ? "paid" : "inactive"}>
                            {p.status === "active" ? "Activo" : "Cancelado"}
                          </Badge>
                        </td>
                        {canCancel && (
                          <td className="px-4 py-3 text-right">
                            {p.status === "active" && (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setCancelTarget(p)}
                              >
                                <Ban className="h-4 w-4" /> Cancelar
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <CancelDialog
        open={Boolean(cancelTarget)}
        title="Cancelar pago"
        message={`¿Cancelar el pago a ${cancelTarget?.user?.name ?? "este empleado"}? Se devolverá el monto a la billetera ${cancelTarget?.currency}.`}
        consequences="La cancelación es irreversible."
        confirmLabel="Cancelar pago"
        loading={cancelling}
        error={cancelError}
        onConfirm={handleCancelPayment}
        onCancel={() => {
          setCancelTarget(null);
          setCancelError("");
        }}
      />
    </div>
  );
}