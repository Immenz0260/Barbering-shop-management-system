import { createContext, useContext, useState } from "react";
import api from "../api/axios";

// createContext() makes the empty "box" — starts as null until a Provider
// fills it with real data.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // We read from localStorage on first load so refreshing the page
  // doesn't log the person out — the token survives as long as the
  // browser's localStorage isn't cleared.
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  async function login(email, password) {
    const res = await api.post("/users/login", { email, password });
    const newToken = res.data.access_token;

    // The JWT has three parts separated by dots: header.payload.signature.
    // The middle part (payload) is just base64-encoded JSON — atob()
    // decodes base64, so this pulls out {user_id, role} without needing
    // a second API call to ask "who am I?"
    const payload = JSON.parse(atob(newToken.split(".")[1]));
    const newUser = { id: payload.user_id, role: payload.role };

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser
  }

  // ====================== REGISTER (NEW) ======================
  async function register(full_name, email, password, phone) {
    const res = await api.post("/users/signup", {
      name: full_name,        // backend expects "name"
      email,
      password,
      phone,
    });
    return res.data;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  // Everything inside this object is what other components can pull out
  // of the "box" when they call useAuth().
  const value = {
    token,
    user,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// A small shortcut so components just write: const { user } = useAuth();
// instead of importing useContext + AuthContext every single time.
export function useAuth() {
  return useContext(AuthContext);
}