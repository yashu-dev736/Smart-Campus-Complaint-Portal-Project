import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser && savedUser !== "undefined" ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const savedToken = localStorage.getItem('token');
      return savedToken && savedToken !== "undefined" ? JSON.parse(savedToken) : null;
    } catch (error) {
      return null;
    }
  });

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create and export the useAuth custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};

// 4. Default export or named exports
export { AuthContext };