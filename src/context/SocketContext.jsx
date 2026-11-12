
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

    io("https://walletpay-backend-4r7o.onrender.com", {
  auth: {
    token: token
  }
})

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from Socket.IO server:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setConnected(false);
    });

    socket.on("notification", (notification) => {
      console.log("New notification:", notification);

      setNotifications((previous) => [
        {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
        },
        ...previous,
      ]);

      // Refresh wallet data without reloading the page
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
