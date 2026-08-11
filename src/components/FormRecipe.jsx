import { useEffect, useState } from "react";
import Input from "./ui/Input.jsx";
import Select from "./ui/Select.jsx";

export default function FormRecipe({ items, initial = null, onSubmit, submitting }) {
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setIngredientId(String(initial.inventoryItemId));
      setQuantity(String(initial.quantityPerUnit));
      setUnit(initial.unit);
    }
  }, [initial]);

  const selectedItem = items.find((i) => String(i.id) === ingredientId);

  const handleUnitChange = (nextUnit) => {
    setUnit(nextUnit);
  };

  const handleIngredientChange = (nextId) => {
    setIngredientId(nextId);
    const item = items.find((i) => String(i.id) === nextId);
    if (item) setUnit(item.unit);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errs = {};
    if (!ingredientId) errs.ingredientId = "Selecciona un ingrediente";
    if (quantity === "" || Number(quantity) <= 0) errs.quantity = "Cantidad inválida";
    if (!unit.trim()) errs.unit = "La unidad es requerida";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      inventoryItemId: Number(ingredientId),
      quantityPerUnit: Number(quantity),
      unit: unit.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {!initial && (
        <Select
          label="Ingrediente"
          value={ingredientId}
          onChange={(e) => handleIngredientChange(e.target.value)}
          error={errors.ingredientId}
        >
          <option value="">Selecciona un ingrediente</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.unit})
            </option>
          ))}
        </Select>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          min="0.001"
          step="0.001"
          label="Cantidad por unidad"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={errors.quantity}
          placeholder={selectedItem?.unit || "0.5"}
        />
        <Input
          label="Unidad"
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value)}
          error={errors.unit}
          placeholder="kg"
        />
      </div>

      {selectedItem && (
        <p className="text-xs text-slate-500">
          Stock disponible de <span className="font-medium">{selectedItem.name}</span>:{" "}
          {selectedItem.stock} {selectedItem.unit}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Guardando..." : initial ? "Guardar cambios" : "Agregar a la receta"}
        </button>
      </div>
    </form>
  );
}
