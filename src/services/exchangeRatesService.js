import api from "./api.js";

export async function createExchangeRate(payload) {
  const { data } = await api.post("/exchange-rates", payload);
  return data;
}

export async function getExchangeRates() {
  const { data } = await api.get("/exchange-rates");
  return data;
}
