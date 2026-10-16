import React, {
  createContext,
  useContext,
  useState,
} from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser || savedUser === "undefined") {
        return null;
      }

      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Error loading user:", error);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const savedToken = localStorage.getItem("token");

      if (!savedToken || savedToken === "undefined") {
        return null;
      }

      return savedToken;
    } catch (error) {
      console.error("Error loading token:", error);
      return null;
    }
  });

  // =========================
  // LOGIN FUNCTION
  // =========================

  const login = (userData, userToken) => {
    try {
      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      localStorage.setItem(
        "token",
        userToken
      );

      setUser(userData);
      setToken(userToken);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // =========================
  // LOGOUT FUNCTION
  // =========================

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =========================
// USE AUTH HOOK
// =========================

export const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthContext };