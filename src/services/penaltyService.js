import { apiFetch } from "./api";

export const createPenaltyCard = async (payload) => {
  return await apiFetch("/api/Penalties/cards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const createPenaltyPoint = async (payload) => {
  return await apiFetch("/api/Penalties/points", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const payPenalty = async (id) => {
  return await apiFetch(`/api/Penalties/${id}/pay`, {
    method: "POST",
  });
};

export const cancelPenalty = async (id, type, reason) => {
  return await apiFetch(`/api/Penalties/${id}/cancel`, {
    method: "PUT",
    body: JSON.stringify({ type, reason }),
  });
};

export const deletePenalty = async (id, type) => {
  return await apiFetch(`/api/Penalties/${id}?type=${type}`, { method: "DELETE" });
};

export const getAllPenaltyCards = async () => {
  return await apiFetch("/api/Penalties/cards", { method: "GET" });
};

export const getAllPenaltyPoints = async () => {
  return await apiFetch("/api/Penalties/points", { method: "GET" });
};
