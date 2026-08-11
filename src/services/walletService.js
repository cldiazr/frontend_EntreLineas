import api from "./api.js";

export async function getWalletTransactions(id, params = {}) {
  const { data } = await api.get(`/wallets/${id}/transactions`, { params });
  return data;
}
