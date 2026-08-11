import api from "./api.js";

export async function createInventoryPurchase(payload) {
  const { data } = await api.post("/inventory-purchases", payload);
  return data;
}

export async function getInventoryPurchases(params = {}) {
  const { data } = await api.get("/inventory-purchases", { params });
  return data;
}
