import api from "./api.js";

export async function getUsers() {
  const { data } = await api.get("/users");
  return data;
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload);
  return data;
}
