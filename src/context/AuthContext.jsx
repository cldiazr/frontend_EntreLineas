import { createContext, useEffect, useMemo, useState } from "react";
import { getMe, login as loginRequest } from "../services/authService.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    getMe()
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      })
      .catch(() => {
        if (!active) return;
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const { token: newToken, user: newUser } = await loginRequest(email, password);
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
