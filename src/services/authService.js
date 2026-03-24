import { apiFetch } from "./api";

export const loginUser = async (payload) => {
  return await apiFetch("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const registerMember = async (payload) => {
  return await apiFetch("/api/Auth/register-member", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};