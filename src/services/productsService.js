import api from "./api.js";

export async function getProducts() {
  const { data } = await api.get("/products");
  return data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
}

export async function getProductRecipes(id) {
  const { data } = await api.get(`/products/${id}/recipes`);
  return data;
}
