import api from "./api.js";

export async function createConversion(payload) {
  const { data } = await api.post("/conversions", payload);
  return data;
}

export async function getConversions(params = {}) {
  const { data } = await api.get("/conversions", { params });
  return data;
}
