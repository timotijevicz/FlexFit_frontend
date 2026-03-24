import { apiFetch } from "./api";

export const createDailyCard = async (payload) => {
  return await apiFetch("/api/Guard/create-daily-card", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const createSubscriptionCard = async (payload) => {
  return await apiFetch("/api/Guard/create-subscription-card", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getAllMembershipCards = async (type = "") => {
  const query = type ? `?type=${type}` : "";
  return await apiFetch(`/api/MembershipCards${query}`);
};

export const checkCardCodeUnique = async (code) => {
  return await apiFetch(`/api/MembershipCards/check-code/${code}`);
};

export const extendMembership = async (cardNumber) => {
  return await apiFetch("/api/Guard/extend-membership", {
    method: "POST",
    body: JSON.stringify(cardNumber),
    headers: {
      "Content-Type": "application/json",
    },
  });
};
export const logEntry = async (payload) => {
  return await apiFetch("/api/Guard/log-entry", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  });
};
