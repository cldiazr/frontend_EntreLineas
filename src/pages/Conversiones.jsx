import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Ban } from "lucide-react";
import {
  getConversions,
  createConversion,
  cancelConversion,
} from "../services/conversionsService.js";
import { getExchangeRates } from "../services/exchangeRatesService.js";
import { getCommissionPresets } from "../services/commissionPresetsService.js";
import { useWallet } from "../hooks/useWallet.js";
import { useToast } from "../hooks/useToast.js";
import { formatDate, formatUSD, formatVES } from "../utils/formatters.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Badge from "../components/ui/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import CancelDialog from "../components/CancelDialog.jsx";
import { SkeletonList } from "../components/ui/Skeleton.jsx";

export default function Conversiones() {
  const { refreshWallets } = useWallet();
  const toast = useToast();

  const [direction, setDirection] = useState("VES_TO_USD");
  const [amountFrom, setAmountFrom] = useState("");
  const [rate, setRate] = useState("");
  const [commissionPct, setCommissionPct] = useState("0");
  const [inputMode, setInputMode] = useState("receive");
  const [presets, setPresets] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [filters, setFilters] = useState({ direction: "", dateFrom: "", dateTo: "" });

  const loadData = useCallback(async () => {
    try {
      const [{ conversions: conversionsData }, { presets: presetsData }, { exchangeRates }] =
        await Promise.all([getConversions(), getCommissionPresets(), getExchangeRates()]);
      setConversions(conversionsData);
      setPresets(presetsData);
      const latest = exchangeRates[0];
      if (latest) setRate(String(latest.rateVESPerUSD));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFilters = useCallback(async () => {
    const params = {};
    if (filters.direction) params.direction = filters.direction;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    const { conversions: data } = await getConversions(params);
    setConversions(data);
  }, [filters]);

  const calc = useMemo(() => {
    const amount = Number(amountFrom);
    const rateValue = Number(rate);
    if (amount <= 0 || rateValue <= 0) return null;

    if (direction === "VES_TO_USD") {
      const pct = Number(commissionPct) || 0;
      const montoUSDBruto = amount / rateValue;
      const comisionPreset = montoUSDBruto * (pct / 100);
      const despuesPreset = montoUSDBruto - comisionPreset;
      const comisionBinance = despuesPreset * 0.041;
      const amountTo = despuesPreset - comisionBinance;
      return {
        comisionPreset,
        comisionBinance,
        commissionAmount: comisionPreset + comisionBinance,
        totalFrom: amount,
        amountTo,
      };
    }

    if (inputMode === "receive") {
      const montoUSDBruto = amount / rateValue;
      const totalFrom = montoUSDBruto + 0.06;
      return {
        comisionPreset: 0,
        comisionBinance: 0.06,
        commissionAmount: 0.06,
        totalFrom,
        amountTo: amount,
      };
    }

    if (amount < 0.06) return null;
    const montoUSDNeto = amount - 0.06;
    const amountTo = montoUSDNeto * rateValue;
    return {
      comisionPreset: 0,
      comisionBinance: 0.60,
      commissionAmount: 0.60,
      totalFrom: amount,
      amountTo,
    };
  }, [amountFrom, rate, direction, commissionPct, inputMode]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      if (direction === "VES_TO_USD") {
        await createConversion({
          direction,
          amountFrom: Number(amountFrom),
          rate: Number(rate),
          commissionPct: Number(commissionPct) || 0,
        });
      } else {
        await createConversion({
          direction,
          amountFrom: Number(amountFrom),
          rate: Number(rate),
          inputMode,
        });
      }
      setConfirmOpen(false);
      setAmountFrom("");
      refreshWallets();
      loadData();
      toast.success("Conversión registrada correctamente");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al registrar la conversión");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setFilters({ direction: "", dateFrom: "", dateTo: "" });
    loadData();
  };

  const handleCancel = async (reason) => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelConversion(cancelTarget.id, reason);
      setCancelTarget(null);
      refreshWallets();
      loadData();
      toast.success("Conversión cancelada: se revirtieron ambas billeteras");
    } catch (error) {
      setCancelError(error.response?.data?.message || "Error al cancelar la conversión");
    } finally {
      setCancelling(false);
    }
  };

  const isVEStoUSD = direction === "VES_TO_USD";

  const montoLabel = isVEStoUSD
    ? "Monto a convertir (VES)"
    : inputMode === "receive"
      ? "Quiero recibir (VES)"
      : "Monto a debitar (USD)";

  const confirmMessage = (() => {
    if (!calc) return "";
    if (isVEStoUSD) {
      return `Vas a convertir ${formatVES(calc.totalFrom)} a USD (tasa ${rate}). Comisión preset: ${formatUSD(calc.comisionPreset)} + Binance: ${formatUSD(calc.comisionBinance)}. Recibirás ${formatUSD(calc.amountTo)}. Esta operación es irreversible.`;
    }
    if (inputMode === "receive") {
      return `Quieres recibir ${formatVES(calc.amountTo)}. Se debitarán ${formatUSD(calc.totalFrom)} (comisión Binance: $0.06). Esta operación es irreversible.`;
    }
    return `Vas a debitar ${formatUSD(calc.totalFrom)}. Recibirás ${formatVES(calc.amountTo)} (comisión Binance: $0.06). Esta operación es irreversible.`;
  })();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Conversiones</h1>
        <p className="text-sm text-slate-500">Cambio de moneda bidireccional</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Dirección"
            value={direction}
            onChange={(e) => {
              setDirection(e.target.value);
              setAmountFrom("");
            }}
          >
            <option value="VES_TO_USD">VES → USD</option>
            <option value="USD_TO_VES">USD → VES</option>
          </Select>

          {!isVEStoUSD && (
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="inputMode"
                  value="receive"
                  checked={inputMode === "receive"}
                  onChange={() => setInputMode("receive")}
                  className="h-4 w-4 border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                Recibir VES
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="inputMode"
                  value="debit"
                  checked={inputMode === "debit"}
                  onChange={() => setInputMode("debit")}
                  className="h-4 w-4 border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                Debitar USD
              </label>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                label={montoLabel}
                value={amountFrom}
                onChange={(e) => setAmountFrom(e.target.value)}
                placeholder={isVEStoUSD ? "1000" : inputMode === "receive" ? "2000" : "20"}
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                label="Tasa (Bs./USD)"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="96.50"
              />
            </div>
          </div>

          {isVEStoUSD && (
            <Select
              label="Comisión (preset)"
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
            >
              <option value="0">Sin comisión</option>
              {presets.map((p) => (
                <option key={p.id} value={p.percentage}>
                  {p.name} ({p.percentage}%)
                </option>
              ))}
            </Select>
          )}

          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-slate-500">Comisión Binance</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {isVEStoUSD ? "4.1% sobre el monto después del preset" : "$0.06 fijo"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          {calc ? (
            <>
              <div className="text-sm">
                {isVEStoUSD ? (
                  <p className="text-slate-600">
                    Bruto: {formatUSD(calc.totalFrom / Number(rate))} ·
                    Preset: {formatUSD(calc.comisionPreset)} ·
                    Binance: {formatUSD(calc.comisionBinance)} ·
                    Debita:{" "}
                    <span className="font-medium text-slate-900">{formatVES(calc.totalFrom)}</span>
                  </p>
                ) : (
                  <p className="text-slate-600">
                    Binance: {formatUSD(0.06)} ·
                    Debita:{" "}
                    <span className="font-medium text-slate-900">{formatUSD(calc.totalFrom)}</span>
                  </p>
                )}
              </div>
              <p className="text-lg font-bold text-slate-900">
                Recibes: {isVEStoUSD ? formatUSD(calc.amountTo) : formatVES(calc.amountTo)}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Ingresa monto y tasa para ver el preview.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={() => setConfirmOpen(true)} disabled={!calc}>
            <ArrowLeftRight className="h-4 w-4" /> Registrar conversión
          </Button>
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold text-slate-800">Filtros de historial</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Dirección"
            value={filters.direction}
            onChange={(e) => setFilters((f) => ({ ...f, direction: e.target.value }))}
          >
            <option value="">Todas</option>
            <option value="VES_TO_USD">VES → USD</option>
            <option value="USD_TO_VES">USD → VES</option>
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
        <SkeletonList rows={4} />
      ) : conversions.length === 0 ? (
        <Card>
          <EmptyState
            icon={ArrowLeftRight}
            title="Sin conversiones"
            description="Las conversiones aparecerán aquí."
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Comisión</th>
                <th className="px-4 py-3 text-right">Debita</th>
                <th className="px-4 py-3 text-right">Recibe</th>
                <th className="px-4 py-3 text-right">Tasa</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversions.map((c) => (
                <tr
                  key={c.id}
                  className={c.status === "cancelled" ? "opacity-50 hover:bg-slate-50" : "hover:bg-slate-50"}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(c.date)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.direction === "VES_TO_USD" ? "info" : "active"}>
                      {c.direction === "VES_TO_USD" ? "VES → USD" : "USD → VES"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {c.direction === "VES_TO_USD" ? formatVES(c.amountFrom) : formatUSD(c.amountFrom)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {c.direction === "VES_TO_USD" ? (
                      <span
                        className="cursor-help"
                        title={`Preset: ${formatUSD(c.commissionPresetAmount)} + Binance: ${formatUSD(c.commissionBinanceAmount)}`}
                      >
                        {formatUSD(c.commissionAmount)}
                      </span>
                    ) : (
                      formatUSD(c.commissionAmount)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {c.direction === "VES_TO_USD" ? formatVES(c.totalFrom) : formatUSD(c.totalFrom)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {c.direction === "VES_TO_USD" ? formatUSD(c.amountTo) : formatVES(c.amountTo)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.rate}</td>
                  <td className="px-4 py-3 text-center">
                    {c.status === "cancelled" ? (
                      <Badge variant="danger">Cancelada</Badge>
                    ) : (
                      <Badge variant="active">Activa</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setCancelTarget(c)}
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

      <ConfirmDialog
        open={confirmOpen}
        title="Registrar conversión"
        message={confirmMessage}
        confirmLabel="Confirmar"
        loading={submitting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <CancelDialog
        open={Boolean(cancelTarget)}
        title="Cancelar conversión"
        message={
          cancelTarget
            ? `¿Cancelar la conversión ${cancelTarget.direction === "VES_TO_USD" ? "VES → USD" : "USD → VES"} de ${cancelTarget.amountFrom}?`
            : ""
        }
        consequences={
          cancelTarget
            ? `Se revertirá en ambas billeteras: origen +${cancelTarget.totalFrom} y destino −${cancelTarget.amountTo}.`
            : ""
        }
        confirmLabel="Cancelar conversión"
        loading={cancelling}
        error={cancelError}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
