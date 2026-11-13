
import {
  createContext,
  useContext,
  useState,
} from "react";

const AuthContext = createContext();

const API_URL = `${
  import.meta.env.DEV
    ? "http://localhost:5001"
    : import.meta.env.VITE_API_URL ||
      "https://walletpay-backend-4r7o.onrender.com"
}/api/auth`;

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

  // REGISTER
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
          message: result.message || "Registration failed.",
        };
      }

      // Return Account ID without logging the user in
      return {
        success: true,
        message: result.message,
        user: result.user,
        accountId: result.user?.accountId,
      };
    } catch (error) {
      console.error("Registration error:", error);

      return {
        success: false,
        message: "Unable to connect to the server.",
      };
    }
  };

  // LOGIN
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
          message: result.message || "Login failed.",
        };
      }

      saveLogin(result);

      return {
        success: true,
        message: result.message,
        user: result.user,
      };
    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        message: "Unable to connect to the server.",
      };
    }
  };

  // SAVE TOKEN AND USER INFORMATION
  const saveLogin = (result) => {
    localStorage.setItem("walletToken", result.token);

    localStorage.setItem(
      "walletUser",
      JSON.stringify(result.user)
    );

    setToken(result.token);
    setUser(result.user);
  };

  // LOGOUT
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
