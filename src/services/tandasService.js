import api from "./api.js";

export async function getSaleBatches() {
  const { data } = await api.get("/sale-batches");
  return data;
}

export async function createSaleBatch(payload) {
  const { data } = await api.post("/sale-batches", payload);
  return data;
}

export async function getSaleBatch(id) {
  const { data } = await api.get(`/sale-batches/${id}`);
  return data;
}

export async function cancelSaleBatch(id, reason) {
  const { data } = await api.patch(`/sale-batches/${id}/cancel`, { reason });
  return data;
}
