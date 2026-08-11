import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import { getProducts, getProductRecipes } from "../services/productsService.js";
import { getInventory } from "../services/inventoryService.js";
import { createRecipe, updateRecipe, deleteRecipe } from "../services/recipesService.js";
import { useToast } from "../hooks/useToast.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Select from "../components/ui/Select.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Badge from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import FormRecipe from "../components/FormRecipe.jsx";
import { SkeletonList } from "../components/ui/Skeleton.jsx";

export default function Recetas() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [{ products: productData }, { items: itemData }] = await Promise.all([
          getProducts(),
          getInventory(),
        ]);
        setProducts(productData);
        setItems(itemData);
        if (productData.length > 0) {
          setSelectedProductId(String(productData[0].id));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadRecipes = useCallback(async () => {
    if (!selectedProductId) {
      setRecipes([]);
      return;
    }
    setRecipesLoading(true);
    try {
      const { product, recipes: recipeData } = await getProductRecipes(selectedProductId);
      setSelectedProduct(product);
      setRecipes(recipeData);
    } finally {
      setRecipesLoading(false);
    }
  }, [selectedProductId]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await createRecipe({ productId: Number(selectedProductId), ...payload });
      setShowForm(false);
      loadRecipes();
      toast.success("Ingrediente agregado a la receta");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al agregar el ingrediente");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await updateRecipe(editing.id, payload);
      setEditing(null);
      loadRecipes();
      toast.success("Ingrediente actualizado");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar el ingrediente");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecipe(deleteTarget.id);
      setDeleteTarget(null);
      loadRecipes();
      toast.success("Ingrediente eliminado de la receta");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar el ingrediente");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recetas</h1>
        <p className="text-sm text-slate-500">Ingredientes por producto para el cálculo de COGS</p>
      </div>

      <Card>
        <Select
          label="Producto"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          <option value="">Selecciona un producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </Select>
      </Card>

      {loading ? (
        <SkeletonList rows={3} />
      ) : products.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="Sin productos"
            description="Crea productos desde la sección Tandas."
          />
        </Card>
      ) : recipesLoading ? (
        <SkeletonList rows={3} />
      ) : (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              Ingredientes de {selectedProduct?.name ?? "este producto"}
              {selectedProduct?.name?.toLowerCase().includes("torta") && (
                <Badge variant="pending">Estimado</Badge>
              )}
            </p>
            <Button size="sm" onClick={() => setShowForm(true)}>
              Agregar ingrediente
            </Button>
          </div>

          {recipes.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Receta vacía"
              description="Agrega ingredientes para que el sistema calcule el costo por unidad."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="pb-2 pr-4">Ingrediente</th>
                    <th className="pb-2 pr-4 text-right">Cant. por unidad</th>
                    <th className="pb-2 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recipes.map((recipe) => (
                    <tr key={recipe.id}>
                      <td className="py-2.5 pr-4 font-medium text-slate-900">
                        {recipe.inventoryItem?.name}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-700">
                        {recipe.quantityPerUnit} {recipe.unit}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditing(recipe)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(recipe)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={`Agregar ingrediente — ${selectedProduct?.name ?? ""}`}
      >
        <FormRecipe items={items} onSubmit={handleCreate} submitting={submitting} />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Editar ${editing?.inventoryItem?.name ?? ""}`}
      >
        <FormRecipe
          items={items}
          initial={editing}
          onSubmit={handleUpdate}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar ingrediente"
        message={`¿Eliminar "${deleteTarget?.inventoryItem?.name}" de la receta de ${selectedProduct?.name}?`}
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
