
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { useAuth } from "./AuthContext";

const WalletContext = createContext();

export const useWallet = () => {
  return useContext(WalletContext);
};

const API_URL = "http://localhost:5001/api/transactions";

// Convert MongoDB transaction data into the format used by the UI
const formatTransaction = (transaction) => ({
  ...transaction,

  id: transaction._id || transaction.id,

  date: transaction.date
    ? new Date(transaction.date).toLocaleString()
    : "",

  icon:
    transaction.type === "income"
      ? "💰"
      : transaction.category === "Entertainment"
      ? "🎬"
      : transaction.category === "Shopping"
      ? "🛍️"
      : "↗️",

  color:
    transaction.type === "income"
      ? "bg-green-100"
      : transaction.category === "Entertainment"
      ? "bg-red-100"
      : "bg-blue-100",
});

export const WalletProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Headers containing JWT token
  const getAuthHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  // Fetch wallet transactions and summary
  const refreshWallet = useCallback(async () => {
    if (!token) {
      setBalance(0);
      setTransactions([]);
      return {
        success: false,
        message: "Please log in first.",
      };
    }

    setLoading(true);
    setError("");

    try {
      const [transactionsResponse, summaryResponse] =
        await Promise.all([
          fetch(API_URL, {
            headers: getAuthHeaders(),
          }),
          fetch(`${API_URL}/summary`, {
            headers: getAuthHeaders(),
          }),
        ]);

      const transactionsResult = await transactionsResponse.json();
      const summaryResult = await summaryResponse.json();

      if (
        !transactionsResponse.ok ||
        !summaryResponse.ok
      ) {
        const message =
          transactionsResult.message ||
          summaryResult.message ||
          "Failed to fetch wallet data.";

        throw new Error(message);
      }

      setTransactions(
        transactionsResult.data.map(formatTransaction)
      );

      setBalance(summaryResult.balance);

      return {
        success: true,
        message: "Wallet data loaded successfully.",
      };
    } catch (err) {
      console.error("Wallet API Error:", err);
      setError(err.message);

      return {
        success: false,
        message: err.message,
      };
    } finally {
      setLoading(false);
    }
  }, [token, getAuthHeaders]);

  // Fetch wallet data after login
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshWallet();
    } else {
      setBalance(0);
      setTransactions([]);
      setError("");
    }
  }, [isAuthenticated, token, refreshWallet]);

  // Add money using POST API
  const addMoney = async (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        message: "Enter a valid amount.",
      };
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: "Money Added",
          amount: Number(amount),
          type: "income",
          category: "Wallet Top-up",
          date: new Date().toISOString().slice(0, 10),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Could not add money.",
        };
      }

      setTransactions((previous) => [
        formatTransaction(result.data),
        ...previous,
      ]);

      setBalance(result.balance);

      return {
        success: true,
        message: `₹${amount.toLocaleString("en-IN")} added successfully!`,
      };
    } catch (err) {
      console.error("Add Money Error:", err);

      return {
        success: false,
        message: "Unable to connect to the server.",
      };
    }
  };

  // Send money using POST API
  const sendMoney = async (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        message: "Enter a valid amount.",
      };
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: "Money Sent",
          amount: Number(amount),
          type: "expense",
          category: "Transfer",
          date: new Date().toISOString().slice(0, 10),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Could not send money.",
        };
      }

      setTransactions((previous) => [
        formatTransaction(result.data),
        ...previous,
      ]);

      setBalance(result.balance);

      return {
        success: true,
        message: `₹${amount.toLocaleString("en-IN")} sent successfully!`,
      };
    } catch (err) {
      console.error("Send Money Error:", err);

      return {
        success: false,
        message: "Unable to connect to the server.",
      };
    }
  };

  // Shared context values
  const value = {
    balance,
    transactions,
    addMoney,
    sendMoney,
    refreshWallet,
    loading,
    error,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
