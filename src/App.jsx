
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import WalletCard from "./components/WalletCard";
import TransactionList from "./components/TransactionList";
import Login from "./components/Login";
import Register from "./components/Register";

import { useWallet } from "./context/WalletContext";
import { useAuth } from "./context/AuthContext";

function App() {
  // Authentication context
  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  // Wallet context
  const {
    balance,
    transactions,
    addMoney,
    sendMoney,
    loading,
    error,
  } = useWallet();

  // Navigation and UI states
  const [activePage, setActivePage] = useState("Dashboard");
  const [showRegister, setShowRegister] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Wallet card information
  const cards = [
    {
      id: 1,
      bank: "WalletPay",
      type: "VISA",
      holder: user?.name?.toUpperCase() || "WALLET USER",
      number: "4582",
      background: "bg-gradient-to-br from-indigo-600 to-purple-700",
    },
    {
      id: 2,
      bank: "WalletPay",
      type: "MASTER",
      holder: user?.name?.toUpperCase() || "WALLET USER",
      number: "8291",
      background: "bg-gradient-to-br from-gray-800 to-gray-950",
    },
  ];

  // Calculate total income
  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  // Calculate total expenses
  const totalExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  // Handle Add Money
  const handleAddMoney = async () => {
    const numericAmount = Number(amount);

    const result = await addMoney(numericAmount);

    setMessage(result.message);
    setMessageType(result.success ? "success" : "error");

    if (result.success) {
      setAmount("");
    }
  };

  // Handle Send Money
  const handleSendMoney = async () => {
    const numericAmount = Number(amount);

    const result = await sendMoney(numericAmount);

    setMessage(result.message);
    setMessageType(result.success ? "success" : "error");

    if (result.success) {
      setAmount("");
    }
  };

  // Show Login/Register before dashboard
  if (!isAuthenticated) {
    return showRegister ? (
      <Register
        onSwitch={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onSwitch={() => setShowRegister(true)}
      />
    );
  }

  // Page descriptions
  const pageDescription = {
    Dashboard: "Welcome back! Manage your digital wallet.",
    "My Cards": "View your available digital wallet cards.",
    Transactions: "View all your wallet transactions.",
    History: "Review your transaction history.",
    Settings: "Manage your wallet preferences.",
  };

  // Wallet cards section
  const renderWalletCards = () => (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          My Wallet Cards
        </h2>

        <button className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-semibold w-full sm:w-auto">
          + Add Card
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <WalletCard
            key={card.id}
            card={card}
            showBalance={showBalance}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          setMessage("");
        }}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {activePage}
            </h1>

            <p className="text-gray-400 text-sm mt-2">
              {pageDescription[activePage]}
            </p>
          </div>

          <div className="flex items-center gap-3">

            <button className="bg-white p-3 rounded-xl shadow-sm">
              🔔
            </button>

            <div className="flex items-center gap-2">

              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="font-semibold text-sm">
                  {user?.name}
                </p>

                <p className="text-xs text-gray-400">
                  {user?.role === "admin"
                    ? "Administrator"
                    : "Personal Account"}
                </p>
              </div>

            </div>

            <button
              onClick={logout}
              className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-semibold"
            >
              Logout
            </button>

          </div>
        </div>

        {/* Loading and Error Messages */}
        {loading && (
          <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl mb-6 text-sm">
            Loading your wallet data...
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* DASHBOARD PAGE */}
        {activePage === "Dashboard" && (
          <>
            {/* Balance Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

              {/* Total Balance */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">

                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-sm">
                    Total Balance
                  </p>

                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-indigo-600 text-sm font-semibold"
                  >
                    {showBalance ? "Hide 👁" : "Show 👁"}
                  </button>
                </div>

                <h2 className="text-3xl font-bold mt-4 text-gray-800">
                  {showBalance
                    ? `₹${balance.toLocaleString("en-IN")}`
                    : "₹ ••••••"}
                </h2>

                <p className="text-green-500 text-sm mt-3">
                  Available Wallet Balance
                </p>

              </div>

              {/* Total Income */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-400 text-sm">
                  Total Income
                </p>

                <h2 className="text-3xl font-bold mt-4 text-gray-800">
                  ₹{totalIncome.toLocaleString("en-IN")}
                </h2>

                <p className="text-green-500 text-sm mt-3">
                  Money received
                </p>
              </div>

              {/* Total Expenses */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-400 text-sm">
                  Total Expenses
                </p>

                <h2 className="text-3xl font-bold mt-4 text-gray-800">
                  ₹{totalExpenses.toLocaleString("en-IN")}
                </h2>

                <p className="text-red-500 text-sm mt-3">
                  Money spent
                </p>
              </div>

            </div>

            {/* Wallet Cards */}
            {renderWalletCards()}

            {/* Quick Money Transfer */}
            <section className="bg-white rounded-2xl shadow-sm p-6 mb-8">

              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Quick Money Transfer
              </h2>

              <p className="text-sm text-gray-400 mb-6">
                Add money or send money using your wallet.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount (₹)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full sm:flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                />

                <button
                  onClick={handleAddMoney}
                  disabled={loading}
                  className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  + Add Money
                </button>

                <button
                  onClick={handleSendMoney}
                  disabled={loading}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  ↗ Send Money
                </button>

              </div>

              {message && (
                <div
                  className={`mt-5 p-4 rounded-xl text-sm font-semibold ${
                    messageType === "success"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {message}
                </div>
              )}

            </section>

            {/* Recent Transactions */}
            <section className="mb-8">
              <TransactionList />
            </section>
          </>
        )}

        {/* MY CARDS PAGE */}
        {activePage === "My Cards" && (
          renderWalletCards()
        )}

        {/* TRANSACTIONS PAGE */}
        {activePage === "Transactions" && (
          <section className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
              All Transactions
            </h2>

            <TransactionList />
          </section>
        )}

        {/* HISTORY PAGE */}
        {activePage === "History" && (
          <section className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
              Transaction History
            </h2>

            <TransactionList />
          </section>
        )}

        {/* SETTINGS PAGE */}
        {activePage === "Settings" && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Wallet Settings
            </h2>

            <p className="text-gray-500 text-sm">
              Settings options will be available here.
            </p>
          </section>
        )}

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-400 text-xs py-5">

          <p>
            © 2026 WalletPay. All rights reserved.
          </p>

          <p className="hidden md:block">
            Secure Digital Wallet
          </p>

        </footer>

      </main>
    </div>
  );
}

export default App;
