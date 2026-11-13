
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const { refreshWallet } = useWallet();

  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      setConnected(false);
      setNotifications([]);
      return;
    }

    // Local development uses the Vite proxy.
    // Production uses the configured backend URL.
    const SOCKET_URL = import.meta.env.DEV
      ? undefined
      : import.meta.env.VITE_API_URL ||
        "https://walletpay-backend-4r7o.onrender.com";

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setConnected(false);
    });

    socket.on("notification", (notification) => {
      console.log("New notification received:", notification);

      setNotifications((previous) => [
        {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
        },
        ...previous,
      ]);

      refreshWallet();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, isAuthenticated, refreshWallet]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const dismissNotification = (id) => {
    setNotifications((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  return (
    <SocketContext.Provider
      value={{
        notifications,
        connected,
        clearNotifications,
        dismissNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
