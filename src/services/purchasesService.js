import api from "./api.js";

export async function createInventoryPurchase(payload) {
  const { data } = await api.post("/inventory-purchases", payload);
  return data;
}

export async function getInventoryPurchases(params = {}) {
  const { data } = await api.get("/inventory-purchases", { params });
  return data;
}

export async function cancelInventoryPurchase(id, reason) {
  const { data } = await api.patch(`/inventory-purchases/${id}/cancel`, { reason });
  return data;
}
