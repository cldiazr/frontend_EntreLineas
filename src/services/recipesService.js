import api from "./api.js";

export async function createRecipe(payload) {
  const { data } = await api.post("/recipes", payload);
  return data;
}

export async function updateRecipe(id, payload) {
  const { data } = await api.put(`/recipes/${id}`, payload);
  return data;
}

export async function deleteRecipe(id) {
  const { data } = await api.delete(`/recipes/${id}`);
  return data;
}
