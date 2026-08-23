import api from "./api.js";

export async function getUsers() {
  const { data } = await api.get("/users");
  return data;
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload);
  return data;
}

export async function approveUser(id, roleId) {
  const { data } = await api.patch(`/users/${id}/approve`, { roleId });
  return data;
}

export async function rejectUser(id) {
  const { data } = await api.patch(`/users/${id}/reject`);
  return data;
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}
