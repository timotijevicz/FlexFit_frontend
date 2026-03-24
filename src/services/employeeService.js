import { apiFetch } from "./api";

export const registerEmployee = async (payload) => {
  return await apiFetch("/api/Auth/register-employee", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getAllEmployees = async () => {
  return await apiFetch("/api/Employees", { method: "GET" });
};

export const deleteEmployee = async (id) => {
  return await apiFetch(`/api/Employees/${id}`, { method: "DELETE" });
};

export const updateEmployee = async (payload) => {
  return await apiFetch("/api/Employees", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};