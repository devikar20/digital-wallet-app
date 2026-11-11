
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import WalletCard from "./components/WalletCard";
import TransactionList from "./components/TransactionList";
import Login from "./components/Login";
import Register from "./components/Register";
import NotificationCenter from "./components/NotificationCenter";

import { useWallet } from "./context/WalletContext";
import { useAuth } from "./context/AuthContext";
import { useSocket } from "./context/SocketContext";

function App() {
  const {
    balance,
    transactions,
    addMoney,
    sendMoney,
    loading,
    error,
  } = useWallet();

  const { user, isAuthenticated, logout } = useAuth();
  const { connected } = useSocket();

  const [activePage, setActivePage] = useState("Dashboard");
  const [showRegister, setShowRegister] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Wallet card details
  const walletCards = [
    {
      bank: "WalletPay",
      type: "VISA",
      holder: user?.name || "Wallet User",
      number: "4829",
      background:
        "bg-gradient-to-r from-indigo-600 to-purple-600",
    },
    {
      bank: "WalletPay Black",
      type: "MASTERCARD",
      holder: user?.name || "Wallet User",
      number: "8291",
      background:
        "bg-gradient-to-r from-gray-900 via-gray-800 to-black",
    },
  ];

  // Calculate income and expenses
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Add money
  const handleAddMoney = async () => {
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Please enter a valid amount.");
      setMessageType("error");
      return;
    }

    const result = await addMoney(value);

    setMessage(result.message);
    setMessageType(result.success ? "success" : "error");

    if (result.success) {
      setAmount("");
    }
  };

  // Send money
  const handleSendMoney = async () => {
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Please enter a valid amount.");
      setMessageType("error");
      return;
    }

    const result = await sendMoney(value);

    setMessage(result.message);
    setMessageType(result.success ? "success" : "error");

    if (result.success) {
      setAmount("");
    }
  };

  // Login / Register screen
  if (!isAuthenticated) {
    return showRegister ? (
      <Register onSwitch={() => setShowRegister(false)} />
    ) : (
      <Login onSwitch={() => setShowRegister(true)} />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 lg:flex-row">

      {/* SIDEBAR */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1 p-4 md:p-8">

        {/* HEADER */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {activePage === "Dashboard"
                ? "WalletPay Dashboard"
                : activePage}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user?.name || "User"}!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* SOCKET CONNECTION STATUS */}
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-500"
                }`}
              />

              <span className="text-xs text-gray-600">
                {connected ? "Live" : "Offline"}
              </span>
            </div>

            {/* NOTIFICATIONS */}
            <NotificationCenter />

            {/* USER ROLE */}
            <span className="rounded-full bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700">
              {user?.role || "user"}
            </span>

            {/* LOGOUT */}
            <button
              onClick={logout}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Logout
            </button>

          </div>
        </header>

        {/* LOADING */}
        {loading && (
          <p className="mb-4 text-sm text-blue-600">
            Loading wallet information...
          </p>
        )}

        {/* ERROR */}
        {error && (
          <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* ================= DASHBOARD ================= */}
        {activePage === "Dashboard" && (
          <div className="space-y-8">

            {/* BALANCE SUMMARY */}
            <section className="grid grid-cols-1 gap-5 md:grid-cols-3">

              {/* TOTAL BALANCE */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">

                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-100">
                    Total Wallet Balance
                  </p>

                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    title="Hide or show balance"
                    className="text-xl"
                  >
                    {showBalance ? "👁" : "🙈"}
                  </button>
                </div>

                <h2 className="mt-4 text-3xl font-bold">
                  {showBalance
                    ? `₹${Number(balance).toLocaleString("en-IN")}`
                    : "₹••••••"}
                </h2>

                <p className="mt-3 text-xs text-blue-100">
                  Available wallet balance
                </p>
              </div>

              {/* INCOME */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Income
                </p>

                <h2 className="mt-4 text-2xl font-bold text-green-600">
                  + ₹{totalIncome.toLocaleString("en-IN")}
                </h2>
              </div>

              {/* EXPENSES */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Expenses
                </p>

                <h2 className="mt-4 text-2xl font-bold text-red-500">
                  - ₹{totalExpenses.toLocaleString("en-IN")}
                </h2>
              </div>

            </section>

            {/* WALLET CARDS */}
            <section>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                <h2 className="text-xl font-bold text-gray-800">
                  My Wallet Cards
                </h2>

                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50"
                >
                  {showBalance
                    ? "🙈 Hide Card Balances"
                    : "👁 Show Card Balances"}
                </button>

              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                {walletCards.map((card) => (
                  <WalletCard
                    key={card.number}
                    card={card}
                    showBalance={showBalance}
                  />
                ))}

              </div>
            </section>

            {/* QUICK TRANSACTIONS */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="mb-5 text-xl font-bold text-gray-800">
                Quick Transactions
              </h2>

              <div className="flex flex-col gap-4 sm:flex-row">

                <input
                  type="number"
                  min="0"
                  placeholder="Enter amount (₹)"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setMessage("");
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />

                <button
                  onClick={handleAddMoney}
                  disabled={loading}
                  className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Add Money
                </button>

                <button
                  onClick={handleSendMoney}
                  disabled={loading}
                  className="rounded-lg bg-red-500 px-6 py-3 font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Send Money
                </button>

              </div>

              {message && (
                <p
                  className={`mt-4 text-sm ${
                    messageType === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}

            </section>

            {/* RECENT TRANSACTIONS */}
            <section>
              <TransactionList />
            </section>

          </div>
        )}

        {/* ================= MY CARDS ================= */}
        {activePage === "My Cards" && (
          <section>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

              <h2 className="text-xl font-bold text-gray-800">
                Your Wallet Cards
              </h2>

              <button
                onClick={() => setShowBalance(!showBalance)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50"
              >
                {showBalance
                  ? "🙈 Hide Card Balances"
                  : "👁 Show Card Balances"}
              </button>

            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

              {walletCards.map((card) => (
                <WalletCard
                  key={card.number}
                  card={card}
                  showBalance={showBalance}
                />
              ))}

            </div>

          </section>
        )}

        {/* ================= TRANSACTIONS ================= */}
        {activePage === "Transactions" && (
          <section>
            <TransactionList />
          </section>
        )}

        {/* ================= HISTORY ================= */}
        {activePage === "History" && (
          <section>
            <TransactionList />
          </section>
        )}

        {/* ================= SETTINGS ================= */}
        {activePage === "Settings" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-xl font-bold text-gray-800">
              Account Settings
            </h2>

            <div className="space-y-3 text-gray-600">

              <p>
                <strong>Name:</strong> {user?.name}
              </p>

              <p>
                <strong>Email:</strong> {user?.email}
              </p>

              <p>
                <strong>Role:</strong> {user?.role}
              </p>

              <p>
                <strong>Socket Connection:</strong>{" "}
                {connected ? "Connected" : "Disconnected"}
              </p>

            </div>

          </section>
        )}

      </main>
    </div>
  );
}

export default App;
