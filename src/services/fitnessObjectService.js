import { apiFetch } from "./api";

export const getAllFitnessObjects = async (searchTerm = "", city = "Sve") => {
  const params = new URLSearchParams();
  if (searchTerm) params.append("searchTerm", searchTerm);
  if (city && city !== "Sve") params.append("city", city);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  
  return await apiFetch(`/api/FitnessObjects${queryString}`, {
    method: "GET",
  });
};

export const getFitnessObjectById = async (id) => {
  return await apiFetch(`/api/FitnessObjects/${id}`, {
    method: "GET",
  });
};

export const createFitnessObject = async (payload) => {
  return await apiFetch("/api/Admin/create-fitness-object", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateFitnessObject = async (payload) => {
  return await apiFetch("/api/Admin/update-fitness-object", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deleteFitnessObject = async (id) => {
  return await apiFetch(`/api/Admin/delete-fitness-object/${id}`, {
    method: "DELETE",
  });
};