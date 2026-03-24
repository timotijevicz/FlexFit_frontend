import { apiFetch } from "./api";

export const getAllMembers = async () => {
  return await apiFetch("/api/Members", { method: "GET" });
};
