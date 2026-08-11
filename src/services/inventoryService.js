import api from "./api.js";

export async function getInventory() {
  const { data } = await api.get("/inventory");
  return data;
}

export async function createInventoryItem(payload) {
  const { data } = await api.post("/inventory", payload);
  return data;
}

export async function updateInventoryItem(id, payload) {
  const { data } = await api.put(`/inventory/${id}`, payload);
  return data;
}

export async function toggleInventoryItem(id) {
  const { data } = await api.patch(`/inventory/${id}/toggle`);
  return data;
}
