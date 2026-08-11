import { useState } from "react";
import { createInventoryPurchase } from "../services/purchasesService.js";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import Select from "./ui/Select.jsx";
import { formatVES } from "../utils/formatters.js";

export default function FormPurchase({ items, defaultItemId, onSuccess, onClose }) {
  const [itemId, setItemId] = useState(defaultItemId ? String(defaultItemId) : "");
  const [quantity, setQuantity] = useState("");
  const [unitPriceVES, setUnitPriceVES] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalVES =
    Number(quantity) > 0 && Number(unitPriceVES) >= 0
      ? Number(quantity) * Number(unitPriceVES)
      : 0;

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const errs = {};
    if (!itemId) errs.itemId = "Selecciona un item";
    if (!quantity || Number(quantity) <= 0) errs.quantity = "Cantidad inválida";
    if (unitPriceVES === "" || Number(unitPriceVES) < 0) errs.unitPriceVES = "Precio inválido";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      await createInventoryPurchase({
        itemId: Number(itemId),
        quantity: Number(quantity),
        unitPriceVES: Number(unitPriceVES),
        supplier: supplier.trim() || null,
        notes: notes.trim() || null,
      });
      onSuccess();
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Error al registrar la compra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <Select
        label="Item"
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
        error={errors.itemId}
      >
        <option value="">Selecciona un item</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.unit})
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          min="0.01"
          step="0.01"
          label="Cantidad"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={errors.quantity}
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          label="Precio unitario (Bs.)"
          value={unitPriceVES}
          onChange={(e) => setUnitPriceVES(e.target.value)}
          error={errors.unitPriceVES}
        />
      </div>

      <Input
        label="Proveedor"
        value={supplier}
        onChange={(e) => setSupplier(e.target.value)}
        placeholder="Opcional"
      />
      <Input
        label="Notas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Opcional"
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <span className="text-slate-600">Total: </span>
        <span className="font-bold text-slate-900">{formatVES(totalVES)}</span>
        <span className="text-xs text-slate-500"> (se debita de la billetera VES)</span>
      </div>

      <div className="flex justify-end gap-2">
        {onClose && (
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          Registrar compra
        </Button>
      </div>
    </form>
  );
}
