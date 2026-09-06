import api from "./api.js";

export async function createEmployeePayment(payload) {
  const { data } = await api.post("/employee-payments", payload);
  return data;
}

export async function getEmployeePayments(params) {
  const { data } = await api.get("/employee-payments", { params });
  return data;
}

export async function cancelEmployeePayment(id, reason) {
  const { data } = await api.patch(`/employee-payments/${id}/cancel`, { reason });
  return data;
}