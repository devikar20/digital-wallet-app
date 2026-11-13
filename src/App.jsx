
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import WalletCard from "./components/WalletCard";
import TransactionList from "./components/TransactionList";
import Login from "./components/Login";
import Register from "./components/Register";
import NotificationCenter from "./components/NotificationCenter";
import AdminDashboard from "./components/AdminDashboard";

import { useWallet } from "./context/WalletContext";
import { useAuth } from "./context/AuthContext";
import { useSocket } from "./context/SocketContext";

function App() {
  const {
    balance,
    transactions,
    addMoney,
    sendMoney,
    findRecipient,
    loading,
    error,
  } = useWallet();

  const { user, isAuthenticated, logout } = useAuth();
  const { connected } = useSocket();

  const [activePage, setActivePage] = useState("Dashboard");
  const [showRegister, setShowRegister] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const [amount, setAmount] = useState("");
  const [recipientAccountId, setRecipientAccountId] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [transferDescription, setTransferDescription] = useState("");
  const [searchingRecipient, setSearchingRecipient] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [copiedAccountId, setCopiedAccountId] = useState(false);

  const handleCopyAccountId = async () => {
    if (!user?.accountId) return;

    try {
      await navigator.clipboard.writeText(user.accountId);
      setCopiedAccountId(true);
      setTimeout(() => setCopiedAccountId(false), 2000);
    } catch (err) {
      console.error("Unable to copy Account ID:", err);
    }
  };

  const walletCards = [
    {
      bank: "WalletPay",
      type: "VISA",
      holder: user?.name || "Wallet User",
      number: "4829",
      background: "bg-gradient-to-r from-indigo-600 to-purple-600",
    },
    {
      bank: "WalletPay Black",
      type: "MASTERCARD",
      holder: user?.name || "Wallet User",
      number: "8291",
      background: "bg-gradient-to-r from-gray-900 via-gray-800 to-black",
    },
  ];

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // ADD MONEY
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

  // FIND RECIPIENT USING ACCOUNT ID
  const handleFindRecipient = async () => {
    if (!/^\d{6}$/.test(recipientAccountId.trim())) {
      setMessage("Please enter a valid 6-digit Account ID.");
      setMessageType("error");
      return;
    }

    setSearchingRecipient(true);
    setRecipient(null);
    setMessage("");

    const result = await findRecipient(recipientAccountId);

    if (result.success) {
      setRecipient(result.recipient);
      setMessage("Recipient verified successfully!");
      setMessageType("success");
    } else {
      setMessage(result.message);
      setMessageType("error");
    }

    setSearchingRecipient(false);
  };

  // SEND MONEY
  const handleSendMoney = async () => {
    const value = Number(amount);

    if (!recipient) {
      setMessage("Please verify the recipient first.");
      setMessageType("error");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Please enter a valid amount.");
      setMessageType("error");
      return;
    }

    if (value > balance) {
      setMessage("Insufficient wallet balance.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to send ₹${value.toLocaleString("en-IN")} to ${recipient.name}?`
    );

    if (!confirmed) return;

    const result = await sendMoney(
      value,
      recipient.accountId,
      transferDescription
    );

    setMessage(result.message);
    setMessageType(result.success ? "success" : "error");

    if (result.success) {
      setAmount("");
      setRecipientAccountId("");
      setRecipient(null);
      setTransferDescription("");
    }
  };

  // LOGIN / REGISTER
  if (!isAuthenticated) {
    return showRegister ? (
      <Register onSwitch={() => setShowRegister(false)} />
    ) : (
      <Login onSwitch={() => setShowRegister(true)} />
    );
  }

  // ADMIN DASHBOARD
  if (user?.role === "admin") {
    return <AdminDashboard onLogout={logout} />;
  }

  // USER DASHBOARD
  return (
    <div className="flex min-h-screen flex-col bg-gray-100 lg:flex-row">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

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

            {/* ACCOUNT ID NEAR PROFILE */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">
                Account ID:
              </span>

              <span className="text-sm font-bold tracking-wider text-indigo-600">
                {user?.accountId || "Not assigned"}
              </span>

              {user?.accountId && (
                <button
                  onClick={handleCopyAccountId}
                  className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                >
                  {copiedAccountId ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            <NotificationCenter />

            <span className="rounded-full bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700">
              {user?.role || "user"}
            </span>

            <button
              onClick={logout}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </header>

        {loading && (
          <p className="mb-4 text-sm text-blue-600">
            Loading wallet information...
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* DASHBOARD */}
        {activePage === "Dashboard" && (
          <div className="space-y-8">
            {/* BALANCE SUMMARY */}
            <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
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

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Total Income</p>
                <h2 className="mt-4 text-2xl font-bold text-green-600">
                  + ₹{totalIncome.toLocaleString("en-IN")}
                </h2>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Total Expenses</p>
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

            {/* ADD MONEY */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-bold text-gray-800">
                Add Money
              </h2>

              <p className="mb-5 text-sm text-gray-500">
                Add money to your WalletPay account.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="number"
                  min="0.01"
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
              </div>
            </section>

            {/* SEND MONEY */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-bold text-gray-800">
                Send Money
              </h2>

              <p className="mb-6 text-sm text-gray-500">
                Transfer money to another registered WalletPay user using
                their Account ID.
              </p>

              <div className="space-y-5">
                {/* RECIPIENT ACCOUNT ID */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Recipient Account ID
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit Account ID"
                      value={recipientAccountId}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);

                        setRecipientAccountId(value);
                        setRecipient(null);
                        setMessage("");
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
                    />

                    <button
                      onClick={handleFindRecipient}
                      disabled={
                        searchingRecipient ||
                        recipientAccountId.length !== 6
                      }
                      className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {searchingRecipient ? "Searching..." : "Find User"}
                    </button>
                  </div>
                </div>

                {/* VERIFIED RECIPIENT */}
                {recipient && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-200 text-xl">
                        👤
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800">
                          {recipient.name}
                        </p>

                        <p className="text-sm text-gray-600">
                          Account ID: {recipient.accountId}
                        </p>

                        <p className="mt-1 text-xs font-medium text-green-700">
                          ✓ WalletPay user verified
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TRANSFER AMOUNT */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Transfer Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    placeholder="Enter amount (₹)"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setMessage("");
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Payment Description
                  </label>

                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Dinner, Shopping, Rent"
                    value={transferDescription}
                    onChange={(e) =>
                      setTransferDescription(e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* BALANCE */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Available Balance
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-800">
                    ₹{Number(balance).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* SEND BUTTON */}
                <button
                  onClick={handleSendMoney}
                  disabled={loading || !recipient}
                  className="w-full rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Send Money"}
                </button>

                {/* MESSAGE */}
                {message && (
                  <p
                    className={`rounded-lg p-3 text-sm ${
                      messageType === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </div>
            </section>

            {/* RECENT TRANSACTIONS */}
            <section>
              <TransactionList />
            </section>
          </div>
        )}

        {/* MY CARDS */}
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

        {/* TRANSACTIONS */}
        {activePage === "Transactions" && (
          <section>
            <TransactionList />
          </section>
        )}

        {/* HISTORY */}
        {activePage === "History" && (
          <section>
            <TransactionList />
          </section>
        )}

        {/* SETTINGS */}
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
                <strong>Account ID:</strong>{" "}
                {user?.accountId || "Not assigned"}
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
