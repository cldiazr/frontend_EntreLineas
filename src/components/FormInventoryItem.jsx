import { useState } from "react";
import { createInventoryItem } from "../services/inventoryService.js";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import Select from "./ui/Select.jsx";

const itemTypes = [
  { value: "ingredient", label: "Ingrediente" },
  { value: "utensil", label: "Utensilio" },
];

export default function FormInventoryItem({ onSuccess, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("ingredient");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [stock, setStock] = useState("0");
  const [minStock, setMinStock] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = "El nombre es requerido";
    if (!category.trim()) errs.category = "La categoría es requerida";
    if (!unit.trim()) errs.unit = "La unidad es requerida";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      await createInventoryItem({
        name: name.trim(),
        type,
        category: category.trim(),
        unit: unit.trim(),
        stock: Number(stock) || 0,
        minStock: minStock === "" ? null : Number(minStock),
      });
      onSuccess();
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Error al crear el item");
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

      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Leche condensada"
        error={errors.name}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
          {itemTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input
          label="Categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="lácteos"
          error={errors.category}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Unidad"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="kg"
          error={errors.unit}
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          label="Stock inicial"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          label="Stock mínimo"
          value={minStock}
          onChange={(e) => setMinStock(e.target.value)}
          placeholder="Opcional"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          Crear item
        </Button>
      </div>
    </form>
  );
}
