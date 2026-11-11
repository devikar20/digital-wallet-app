
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";
import { SocketProvider } from "./context/SocketContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <WalletProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </WalletProvider>
    </AuthProvider>
  </React.StrictMode>
);
