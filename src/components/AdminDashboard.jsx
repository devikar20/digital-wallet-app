
import { useEffect, useState } from "react";

const API_URL = `${
  import.meta.env.DEV
    ? "http://localhost:5001"
    : import.meta.env.VITE_API_URL ||
      "https://walletpay-backend-4r7o.onrender.com"
}/api/admin`;

function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("walletToken");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [usersRes, transactionsRes] = await Promise.all([
          fetch(`${API_URL}/users`, { headers }),
          fetch(`${API_URL}/transactions`, { headers }),
        ]);

        if (!usersRes.ok || !transactionsRes.ok) {
          throw new Error(
            "Unable to load admin data. Check your admin login."
          );
        }

        const usersData = await usersRes.json();
        const transactionsData = await transactionsRes.json();

        setUsers(usersData.data || []);
        setTransactions(transactionsData.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const totalTransferred = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Admin Dashboard
          </h1>

          <button
            onClick={onLogout}
            className="rounded-lg bg-red-500 px-5 py-2 text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <p className="mt-6 text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      {/* HEADER */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Welcome to WalletPay administration.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="rounded-lg bg-red-500 px-5 py-2.5 font-medium text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">Total Users</p>
          <h2 className="mt-2 text-3xl font-bold">
            {users.length}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">Total Transactions</p>
          <h2 className="mt-2 text-3xl font-bold">
            {transactions.length}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-500">Total Expense Transactions</p>
          <h2 className="mt-2 text-3xl font-bold">
            ₹{totalTransferred.toLocaleString("en-IN")}
          </h2>
        </div>
      </div>

      {/* REGISTERED USERS */}
      <div className="mt-10 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-5 text-xl font-bold">
          Registered Users
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Account ID</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    {user.accountId || "—"}
                  </td>
                  <td className="p-3 capitalize">
                    {user.role}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALL TRANSACTIONS */}
      <div className="mt-10 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-5 text-xl font-bold">
          All Transactions
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="p-3">User</th>
                <th className="p-3">Transaction</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="border-b">
                  <td className="p-3">
                    {transaction.user?.name || "Unknown"}
                  </td>

                  <td className="p-3">
                    {transaction.name}
                  </td>

                  <td className="p-3 capitalize">
                    {transaction.type}
                  </td>

                  <td className="p-3">
                    ₹{Number(transaction.amount).toLocaleString("en-IN")}
                  </td>

                  <td className="p-3">
                    {new Date(transaction.date).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
