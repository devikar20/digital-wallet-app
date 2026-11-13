
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Register = ({ onSwitch }) => {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setAccountId("");

    try {
      const result = await register(name, email, password);

      if (result.success) {
        const newAccountId =
          result.user?.accountId ||
          result.accountId;

        if (newAccountId) {
          setAccountId(newAccountId);
        } else {
          setMessage(
            "Registration successful, but Account ID was not returned. Please log in to retrieve it."
          );
        }
      } else {
        setMessage(result.message || "Registration failed.");
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage("Unable to copy. Please copy the ID manually.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-extrabold text-indigo-600 text-center mb-2">
          WalletPay.
        </h1>

        {!accountId ? (
          <>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
              Create Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded-xl p-3"
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border rounded-xl p-3"
              />

              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="w-full border rounded-xl p-3"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-xl p-3 font-semibold disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Register"}
              </button>

            </form>

            {message && (
              <p className="text-center text-sm text-red-500 mt-4">
                {message}
              </p>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <button
                onClick={onSwitch}
                className="text-indigo-600 font-semibold"
              >
                Login
              </button>
            </p>
          </>
        ) : (
          <div className="mt-6 text-center">

            <div className="text-5xl mb-4">🎉</div>

            <h2 className="text-2xl font-bold text-gray-800">
              Registration Successful!
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Your WalletPay account has been created.
              Here is your unique Account ID.
            </p>

            <div className="mt-6 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-5">
              <p className="text-sm font-medium text-gray-600">
                Your Account ID
              </p>

              <h1 className="mt-2 text-4xl font-extrabold tracking-widest text-indigo-700">
                {accountId}
              </h1>

              <button
                onClick={handleCopy}
                className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {copied ? "Copied!" : "Copy Account ID"}
              </button>
            </div>

            <p className="mt-5 text-sm text-amber-600">
              Save this Account ID! You will need it to receive money.
            </p>

            <button
              onClick={onSwitch}
              className="mt-6 w-full rounded-xl bg-green-600 p-3 font-semibold text-white hover:bg-green-700"
            >
              Continue to Login
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

export default Register;
