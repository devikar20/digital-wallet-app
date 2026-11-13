
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { useAuth } from "./AuthContext";

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

const API_URL = `${
  import.meta.env.DEV
    ? "http://localhost:5001"
    : import.meta.env.VITE_API_URL ||
      "https://walletpay-backend-4r7o.onrender.com"
}/api/transactions`;

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

  const getAuthHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // REFRESH WALLET
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

      if (!transactionsResponse.ok || !summaryResponse.ok) {
        throw new Error(
          transactionsResult.message ||
          summaryResult.message ||
          "Failed to fetch wallet data."
        );
      }

      setTransactions(
        transactionsResult.data.map(formatTransaction)
      );

      setBalance(summaryResult.balance);

      return {
        success: true,
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

  // AUTOMATIC WALLET REFRESH
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshWallet();
    } else {
      setBalance(0);
      setTransactions([]);
      setError("");
    }
  }, [isAuthenticated, token, refreshWallet]);

  // ADD MONEY
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
          date: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Could not add money.",
        };
      }

      await refreshWallet();

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

  // SEARCH RECIPIENT USING ACCOUNT ID
  const findRecipient = async (accountId) => {
    const cleanAccountId = String(accountId || "").trim();

    if (!/^\d{6}$/.test(cleanAccountId)) {
      return {
        success: false,
        message: "Enter a valid 6-digit Account ID.",
      };
    }

    try {
      const response = await fetch(
        `${API_URL}/recipients?accountId=${encodeURIComponent(cleanAccountId)}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Recipient not found.",
        };
      }

      return {
        success: true,
        recipient: result.data,
      };
    } catch (err) {
      console.error("Recipient Search Error:", err);

      return {
        success: false,
        message: "Unable to connect to the server.",
      };
    }
  };

  // TRANSFER MONEY USING ACCOUNT ID
  const sendMoney = async (
    amount,
    recipientAccountId,
    description = ""
  ) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        message: "Enter a valid amount.",
      };
    }

    const cleanAccountId = String(
      recipientAccountId || ""
    ).trim();

    if (!/^\d{6}$/.test(cleanAccountId)) {
      return {
        success: false,
        message: "Enter a valid recipient Account ID.",
      };
    }

    try {
      const response = await fetch(`${API_URL}/transfer`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          recipientAccountId: cleanAccountId,
          amount: Number(amount),
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Transfer failed.",
        };
      }

      await refreshWallet();

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (err) {
      console.error("Transfer Error:", err);

      return {
        success: false,
        message: "Unable to connect to the server.",
      };
    }
  };

  const value = {
    balance,
    transactions,
    addMoney,
    sendMoney,
    findRecipient,
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
