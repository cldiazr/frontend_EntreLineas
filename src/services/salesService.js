import api from "./api.js";

export async function getSales(params = {}) {
  const { data } = await api.get("/sales", { params });
  return data;
}

export async function createSale(payload) {
  const { data } = await api.post("/sales", payload);
  return data;
}

export async function getSale(id) {
  const { data } = await api.get(`/sales/${id}`);
  return data;
}

export async function createPayment(saleId, payload) {
  const { data } = await api.post(`/sales/${saleId}/payments`, payload);
  return data;
}

export async function getPayments(saleId) {
  const { data } = await api.get(`/sales/${saleId}/payments`);
  return data;
}

export async function cancelSale(id, reason) {
  const { data } = await api.patch(`/sales/${id}/cancel`, { reason });
  return data;
}

export async function cancelPayment(saleId, paymentId, reason) {
  const { data } = await api.patch(`/sales/${saleId}/payments/${paymentId}/cancel`, { reason });
  return data;
}
