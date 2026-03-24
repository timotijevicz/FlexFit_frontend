import React, { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export const AppContext = createContext();

function AppProvider({ children }) {
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken"));
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState(null);
  const [fullName, setFullName] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authToken) {
      clearUserState();
      setIsLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(authToken);
      setUser(decoded);

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        logout();
        setIsLoading(false);
        return;
      }

      const roleClaim =
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
        decoded.role;

      const roles = Array.isArray(roleClaim)
        ? roleClaim
        : roleClaim
          ? [roleClaim]
          : [];

      setIsAdmin(roles.includes("Admin"));
      setIsEmployee(roles.includes("Employee"));
      setIsMember(roles.includes("Member"));

      const id =
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        decoded.nameid ||
        decoded.sub ||
        null;

      const emailClaim =
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
        decoded.email ||
        null;

      const nameClaim =
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        decoded.unique_name ||
        decoded.name ||
        null;

      setUserId(id);
      setEmail(emailClaim);
      setFullName(nameClaim);
    } catch (err) {
      console.log("Token decode error:", err.message);
      // Don't logout immediately on decode error if we have a refresh token
      if (!refreshToken) logout();
    }

    setIsLoading(false);
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !refreshToken) return;

    try {
      const decoded = jwtDecode(authToken);
      const expiresAt = decoded.exp * 1000;
      const timeout = expiresAt - Date.now() - 60000; // Refresh 1 minute before expiry

      if (timeout > 0) {
        const timerId = setTimeout(refreshAccessToken, timeout);
        return () => clearTimeout(timerId);
      } else {
        refreshAccessToken();
      }
    } catch (err) {
      console.error("Silent refresh setup error:", err);
    }
  }, [authToken, refreshToken]);

  function clearUserState() {
    setUser(null);
    setUserId(null);
    setEmail(null);
    setFullName(null);
    setIsAdmin(false);
    setIsEmployee(false);
    setIsMember(false);
  }

  async function refreshAccessToken() {
    if (!refreshToken || !authToken) return;

    try {
      const response = await fetch("https://localhost:7127/api/Auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: authToken, refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.accessToken, data.refreshToken);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Refresh token error:", err);
      logout();
    }
  }

  function login(token, rToken) {
    localStorage.setItem("authToken", token);
    if (rToken) localStorage.setItem("refreshToken", rToken);
    setAuthToken(token);
    if (rToken) setRefreshToken(rToken);
  }

  function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    setAuthToken(null);
    setRefreshToken(null);
    clearUserState();
  }

  return (
    <AppContext.Provider
      value={{
        authToken,
        user,
        userId,
        email,
        fullName,
        isAdmin,
        isEmployee,
        isMember,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;