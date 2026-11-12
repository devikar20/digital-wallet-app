
import {
  createContext,
  useContext,
  useState,
} from "react";

const AuthContext = createContext();

const API_URL = "/api/auth";

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem("walletToken")
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("walletUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Register
  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message,
        };
      }

      saveLogin(result);

      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: "Unable to connect to the server.",
      };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message,
        };
      }

      saveLogin(result);

      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: "Unable to connect to the server.",
      };
    }
  };

  // Save token and user information
  const saveLogin = (result) => {
    localStorage.setItem("walletToken", result.token);
    localStorage.setItem(
      "walletUser",
      JSON.stringify(result.user)
    );

    setToken(result.token);
    setUser(result.user);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("walletToken");
    localStorage.removeItem("walletUser");

    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    login,
    register,
    logout,
    isAuthenticated: Boolean(token),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
