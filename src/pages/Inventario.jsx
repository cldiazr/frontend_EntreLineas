import { useCallback, useEffect, useState } from "react";
import { Boxes, PackagePlus } from "lucide-react";
import { getInventory, toggleInventoryItem } from "../services/inventoryService.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import StockBadge from "../components/ui/StockBadge.jsx";
import FormInventoryItem from "../components/FormInventoryItem.jsx";
import FormPurchase from "../components/FormPurchase.jsx";

export default function Inventario() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ingredient");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailView, setDetailView] = useState("detail");

  const loadItems = useCallback(async () => {
    try {
      const { items: data } = await getInventory();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filtered = items.filter((item) => item.type === tab);

  const handleCreated = () => {
    setCreateOpen(false);
    loadItems();
  };

  const handleToggle = async (item) => {
    await toggleInventoryItem(item.id);
    if (detail && detail.id === item.id) {
      setDetail({ ...detail, active: !detail.active });
    }
    loadItems();
  };

  const handlePurchaseCreated = () => {
    setDetailView("detail");
    setDetail(null);
    loadItems();
  };

  const tabs = [
    { value: "ingredient", label: "Ingredientes" },
    { value: "utensil", label: "Utensilios" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500">Ingredientes y utensilios con stock</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PackagePlus className="h-4 w-4" /> Nuevo item
        </Button>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.value
                ? "border-amber-500 text-amber-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Boxes}
            title={`Sin ${tab === "ingredient" ? "ingredientes" : "utensilios"}`}
            description="Agrega items a tu inventario."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <button
                type="button"
                className="flex w-full flex-col gap-2 text-left"
                onClick={() => {
                  setDetail(item);
                  setDetailView("detail");
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.category} · {item.unit}
                    </p>
                  </div>
                  <Badge variant={item.active ? "active" : "inactive"}>
                    {item.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <StockBadge stock={item.stock} minStock={item.minStock} />
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo item de inventario">
        <FormInventoryItem onSuccess={handleCreated} onClose={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detailView === "detail" ? detail?.name : `Registrar Compra — ${detail?.name}`}
      >
        {detail && detailView === "detail" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Categoría</p>
                <p className="font-medium text-slate-900">{detail.category}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Unidad</p>
                <p className="font-medium text-slate-900">{detail.unit}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Stock actual</p>
                <StockBadge stock={detail.stock} minStock={detail.minStock} />
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Stock mínimo</p>
                <p className="font-medium text-slate-900">{detail.minStock ?? "—"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setDetailView("purchase")}>
                <PackagePlus className="h-4 w-4" /> Registrar Compra
              </Button>
              <Button variant="secondary" onClick={() => handleToggle(detail)}>
                {detail.active ? "Desactivar" : "Activar"}
              </Button>
            </div>
          </div>
        )}
        {detail && detailView === "purchase" && (
          <FormPurchase
            items={items}
            defaultItemId={detail.id}
            onSuccess={handlePurchaseCreated}
            onClose={() => setDetailView("detail")}
          />
        )}
      </Modal>
    </div>
  );
}
