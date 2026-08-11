import api from "./api.js";

export async function getDashboardSummary(params = {}) {
  const { data } = await api.get("/dashboard/summary", { params });
  return data;
}

export async function getDashboardMonthly(params = {}) {
  const { data } = await api.get("/dashboard/monthly", { params });
  return data;
}

export async function getProductPerformance(params = {}) {
  const { data } = await api.get("/dashboard/product-performance", { params });
  return data;
}

export async function getDashboardCogs(params = {}) {
  const { data } = await api.get("/dashboard/cogs", { params });
  return data;
}
