// ============================================================
// AuthContext.jsx
// Global "who is logged in" store. It saves the token + user
// in localStorage, exposes login/register/logout/updateUser,
// and lets any page read the user via the useAuth() hook.
// ============================================================
import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api";
import toast from "react-hot-toast";

// The shared React Context object that holds auth data.
const AuthContext = createContext();

// Wraps the whole app and provides auth state + actions to all children.
export const AuthProvider = ({ children }) => {
  // Currently logged-in user object (null when logged out).
  const [user, setUser] = useState(null);
  // True while the saved session is being checked on first load.
  const [loading, setLoading] = useState(true);

  // Runs once on startup: restore the session from localStorage
  // and double-check the token is still valid with the server.
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      if (token && savedUser) {
        try {
          // Show the cached user instantly, then refresh details from /auth/me.
          setUser(JSON.parse(savedUser));
          const res = await authAPI.getMe();
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          // Bad/expired token: wipe the stored session.
          console.error("Auth init error:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      // Finished checking - let the app render normally.
      setLoading(false);
    };
    initAuth();
  }, []);

  // Calls the login API, saves token + user, shows a toast and returns the result.
  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Creates a new account; on success the user is logged in immediately.
  const register = async (formData) => {
    try {
      const res = await authAPI.register(formData);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.success(`Account created successfully! Welcome, ${res.data.user.name}!`);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Clears the stored session (even if the server call fails) and redirects to /login.
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      console.warn("Logout API call error", e);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    }
  };

  // Merges partial profile changes into the current user and keeps localStorage in sync.
  const updateUser = (updated) => {
    setUser((prev) => {
      const next = { ...prev, ...updated };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  return (
    // Everything below is available to any component via useAuth().
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, role: user?.role }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook any component can call: const { user, login } = useAuth();
export const useAuth = () => useContext(AuthContext);
