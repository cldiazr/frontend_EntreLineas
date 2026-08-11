import api from "./api.js";

export async function getCommissionPresets() {
  const { data } = await api.get("/commission-presets");
  return data;
}

export async function createCommissionPreset(payload) {
  const { data } = await api.post("/commission-presets", payload);
  return data;
}

export async function deleteCommissionPreset(id) {
  const { data } = await api.delete(`/commission-presets/${id}`);
  return data;
}
