import api from "./api.js";

export async function getWallets() {
  const { data } = await api.get("/wallets");
  return data;
}
