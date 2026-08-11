import { useState } from "react";
import { createSale } from "../services/salesService.js";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import Select from "./ui/Select.jsx";
import { formatUSD } from "../utils/formatters.js";

export default function FormSale({ productions, onSuccess, onClose }) {
  const [productionId, setProductionId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [step, setStep] = useState("form");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const production = productions.find((p) => p.id === Number(productionId));
  const totalUSD = production && Number(quantity) ? Number(quantity) * production.unitPriceUSD : 0;

  const validate = () => {
    const errs = {};
    if (!productionId) errs.productionId = "Selecciona una producción";
    if (!customerName.trim()) errs.customerName = "El nombre del cliente es requerido";
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      errs.quantity = "Cantidad inválida";
    } else if (production && qty > production.quantityAvailable) {
      errs.quantity = `Máximo ${production.quantityAvailable} porciones disponibles`;
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
      await createSale({
        batchProductionId: Number(productionId),
        customerName: customerName.trim(),
        quantity: Number(quantity),
      });
      onSuccess();
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Error al registrar la venta");
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
          <Select
            label="Producción (tanda + producto)"
            value={productionId}
            onChange={(e) => {
              setProductionId(e.target.value);
              setQuantity("");
            }}
            error={errors.productionId}
          >
            <option value="">Selecciona una producción</option>
            {productions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>

          <Input
            label="Nombre del cliente"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="María"
            error={errors.customerName}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min="1"
              max={production?.quantityAvailable}
              label="Cantidad (porciones)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={errors.quantity}
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Precio porción</span>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {production ? formatUSD(production.unitPriceUSD) : "—"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <span className="text-slate-600">Total a pagar: </span>
            <span className="font-bold text-slate-900">{formatUSD(totalUSD)}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleNext} disabled={!productionId}>
              Revisar venta
            </Button>
          </div>
        </>
      )}

      {step === "confirm" && production && (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="mb-2 font-semibold text-slate-800">Confirmación de venta</p>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Cliente</span>
              <span className="font-medium text-slate-900">{customerName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Producción</span>
              <span className="font-medium text-slate-900">{production.label}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Cantidad</span>
              <span className="font-medium text-slate-900">{quantity}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 py-1 font-semibold">
              <span className="text-slate-800">Total USD</span>
              <span className="text-slate-900">{formatUSD(totalUSD)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              La venta NO afecta las billeteras; genera una cuenta por cobrar pendiente.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep("form")}>
              Volver
            </Button>
            <Button loading={submitting} onClick={handleSubmit}>
              Registrar venta
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
