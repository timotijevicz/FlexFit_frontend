import { apiFetch } from "./api";

export const getStatistics = async () => {
  return await apiFetch("/api/Statistics", { method: "GET" });
};
