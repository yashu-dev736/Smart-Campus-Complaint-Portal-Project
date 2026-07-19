import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("scc_user");
    const token = localStorage.getItem("scc_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

const login = async (email, password) => {
  // This combines with baseURL to make: .../render.com/api/auth/login
  const { data } = await api.post("/api/auth/login", { email, password });
  
  localStorage.setItem("scc_token", data.token);
  localStorage.setItem("scc_user", JSON.stringify(data.user));
  setUser(data.user);
  return data.user;
};
  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("scc_token", data.token);
    localStorage.setItem("scc_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("scc_token");
    localStorage.removeItem("scc_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
