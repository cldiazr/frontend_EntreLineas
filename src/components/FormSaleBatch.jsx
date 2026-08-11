import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { getInventory } from "../services/inventoryService.js";
import { getProducts, getProductRecipes } from "../services/productsService.js";
import { createSaleBatch } from "../services/tandasService.js";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";

export default function FormSaleBatch({ onSuccess, onClose }) {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState("form");
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ products: prods }, { items }] = await Promise.all([
          getProducts(),
          getInventory(),
        ]);
        if (!active) return;
        setProducts(prods);
        setInventory(items);

        const results = await Promise.all(
          prods.map((p) =>
            getProductRecipes(p.id)
              .then(({ recipes: r }) => ({ id: p.id, recipes: r }))
              .catch(() => ({ id: p.id, recipes: [] }))
          )
        );
        const recipeMap = {};
        results.forEach(({ id, recipes: r }) => {
          recipeMap[id] = r;
        });
        if (active) setRecipes(recipeMap);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggleProduct = (product) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = {
          quantityProduced: product.unitsProduced,
          unitPriceUSD: "",
        };
      }
      return next;
    });
  };

  const updateField = (id, field, value) => {
    setSelected((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const warnings = useMemo(() => {
    const result = [];
    for (const [productId, cfg] of Object.entries(selected)) {
      const product = products.find((p) => p.id === Number(productId));
      if (!product) continue;
      const qty = Number(cfg.quantityProduced) || 0;
      const productUnits = qty / product.unitsProduced;
      for (const recipe of recipes[Number(productId)] || []) {
        const required = recipe.quantityPerUnit * productUnits;
        const item = inventory.find((i) => i.id === recipe.inventoryItemId);
        if (!item) continue;
        if (Number(item.stock) < required) {
          result.push({
            product: product.name,
            item: item.name,
            required,
            unit: recipe.unit,
            stock: item.stock,
            shortBy: required - item.stock,
          });
        }
      }
    }
    return result;
  }, [selected, products, recipes, inventory]);

  const validate = () => {
    const errors = {};
    const ids = Object.keys(selected);
    if (ids.length === 0) {
      errors.products = "Selecciona al menos un producto";
    }
    for (const id of ids) {
      const cfg = selected[id];
      if (!cfg.quantityProduced || Number(cfg.quantityProduced) <= 0) {
        errors[`qty_${id}`] = "Cantidad inválida";
      }
      if (!cfg.unitPriceUSD || Number(cfg.unitPriceUSD) <= 0) {
        errors[`price_${id}`] = "Precio USD inválido";
      }
    }
    return errors;
  };

  const handleNext = () => {
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setStep("confirm");
  };

  const handleSubmit = async () => {
    const productions = Object.entries(selected).map(([productId, cfg]) => ({
      productId: Number(productId),
      quantityProduced: Number(cfg.quantityProduced),
      unitPriceUSD: Number(cfg.unitPriceUSD),
    }));
    setSubmitting(true);
    setSubmitError("");
    try {
      const { warnings: backendWarnings } = await createSaleBatch({
        productions,
        notes,
      });
      onSuccess(backendWarnings || []);
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Error al registrar la tanda");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {step === "form" && (
        <>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Productos a producir</p>
            {formErrors.products && (
              <p className="mb-2 text-xs text-red-600">{formErrors.products}</p>
            )}
            <div className="flex flex-col gap-3">
              {products.map((product) => {
                const isSelected = Boolean(selected[product.id]);
                const cfg = selected[product.id] || {};
                return (
                  <div
                    key={product.id}
                    className={`rounded-lg border p-3 ${
                      isSelected ? "border-amber-400 bg-amber-50" : "border-slate-200"
                    }`}
                  >
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProduct(product)}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {product.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({product.unitsProduced} porciones por unidad)
                      </span>
                    </label>
                    {isSelected && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          min="1"
                          label="Cantidad (porciones)"
                          value={cfg.quantityProduced ?? ""}
                          onChange={(e) =>
                            updateField(product.id, "quantityProduced", e.target.value)
                          }
                          error={formErrors[`qty_${product.id}`]}
                        />
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          label="Precio USD / porción"
                          placeholder="1.25"
                          value={cfg.unitPriceUSD ?? ""}
                          onChange={(e) =>
                            updateField(product.id, "unitPriceUSD", e.target.value)
                          }
                          error={formErrors[`price_${product.id}`]}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4" /> Stock insuficiente
              </p>
              <ul className="list-inside list-disc text-xs text-amber-700">
                {warnings.map((w, i) => (
                  <li key={i}>
                    {w.product}: falta {w.shortBy.toFixed(2)} {w.unit} de {w.item} (stock:{" "}
                    {w.stock})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Input
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
          />

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleNext}>Revisar tanda</Button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Confirmación de tanda</p>
            {Object.entries(selected).map(([productId, cfg]) => {
              const product = products.find((p) => p.id === Number(productId));
              return (
                <div key={productId} className="flex justify-between py-1 text-sm">
                  <span className="text-slate-700">
                    {product.name} · {cfg.quantityProduced} porciones
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatNumber(cfg.unitPriceUSD)} USD/porción
                  </span>
                </div>
              );
            })}
            {warnings.length > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Se registrará con stock insuficiente (se continuará con advertencia).
              </p>
            )}
            {notes && <p className="mt-3 text-xs text-slate-500">Notas: {notes}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep("form")}>
              Volver
            </Button>
            <Button loading={submitting} onClick={handleSubmit}>
              Registrar tanda
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "—";
}
