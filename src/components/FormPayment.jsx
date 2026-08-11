import { useState } from "react";
import { createPayment } from "../services/salesService.js";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import { formatUSD } from "../utils/formatters.js";

export default function FormPayment({ sale, remainingUSD, onSuccess, onClose }) {
  const [amountVES, setAmountVES] = useState("");
  const [rate, setRate] = useState("");
  const [step, setStep] = useState("form");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amountUSD =
    Number(amountVES) > 0 && Number(rate) > 0 ? Number(amountVES) / Number(rate) : 0;

  const validate = () => {
    const errs = {};
    if (!amountVES || Number(amountVES) <= 0) errs.amountVES = "Monto inválido";
    if (!rate || Number(rate) <= 0) errs.rate = "Tasa inválida";
    if (remainingUSD != null && amountUSD > remainingUSD + 0.001) {
      errs.amountVES = `El monto excede el pendiente (${formatUSD(remainingUSD)})`;
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStep("confirm");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await createPayment(sale.id, {
        amountVES: Number(amountVES),
        rateVESPerUSD: Number(rate),
      });
      onSuccess();
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Error al registrar el pago");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {step === "form" && (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Cliente</span>
              <span className="font-medium text-slate-900">{sale.customerName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Total venta</span>
              <span className="font-medium text-slate-900">{formatUSD(sale.totalUSD)}</span>
            </div>
            <div className="flex justify-between py-1 font-semibold">
              <span className="text-slate-800">Pendiente</span>
              <span className="text-slate-900">{formatUSD(remainingUSD)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              label="Monto en Bs. (VES)"
              value={amountVES}
              onChange={(e) => setAmountVES(e.target.value)}
              placeholder="241.25"
              error={errors.amountVES}
            />
            <Input
              type="number"
              min="0.01"
              step="0.01"
              label="Tasa del día (Bs./USD)"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="96.50"
              error={errors.rate}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <span className="text-slate-600">Equivale a: </span>
            <span className="font-bold text-slate-900">{formatUSD(amountUSD)}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleNext}>Revisar pago</Button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="mb-2 font-semibold text-slate-800">Confirmación de pago</p>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Monto VES</span>
              <span className="font-medium text-slate-900">Bs. {Number(amountVES).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Tasa</span>
              <span className="font-medium text-slate-900">{Number(rate).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 py-1 font-semibold">
              <span className="text-slate-800">Equivale a</span>
              <span className="text-slate-900">{formatUSD(amountUSD)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              El pago acredita la billetera VES y actualiza la cuenta del cliente.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep("form")}>
              Volver
            </Button>
            <Button loading={submitting} onClick={handleSubmit}>
              Registrar pago
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
