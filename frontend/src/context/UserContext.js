import { createContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Al cargar, busca si hay usuario guardado
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Función para iniciar sesión
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Función para cerrar sesión
  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}