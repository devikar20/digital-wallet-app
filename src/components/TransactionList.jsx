import { useWallet } from "../context/WalletContext";

const TransactionList = () => {

  const { transactions } = useWallet();

  return (

    <div className="bg-white rounded-2xl p-6 shadow-sm">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-lg font-bold text-gray-800">
          Recent Transactions
        </h2>

        <span className="text-indigo-600 text-sm font-semibold">
          {transactions.length} Transactions
        </span>

      </div>


      <div className="space-y-5">

        {transactions.length === 0 ? (

          <p className="text-center text-gray-400 py-8">
            No transactions available.
          </p>

        ) : (

          transactions.map((transaction) => (

            <div
              key={transaction.id}
              className="flex items-center justify-between gap-3"
            >

              <div className="flex items-center gap-3 min-w-0">

                <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl ${transaction.color}`}>
                  {transaction.icon}
                </div>

                <div className="min-w-0">

                  <h3 className="font-semibold text-sm text-gray-800">
                    {transaction.name}
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    {transaction.date}
                  </p>

                </div>

              </div>


              <div className="text-right shrink-0">

                <p className={`font-bold text-sm ${
                  transaction.type === "income"
                    ? "text-green-500"
                    : "text-gray-800"
                }`}>

                  {transaction.type === "income" ? "+" : "-"}
                  ₹{transaction.amount.toLocaleString("en-IN")}

                </p>

                <span className="text-xs text-green-500">
                  {transaction.status}
                </span>

              </div>

            </div>

          ))

        )}

      </div>

    </div>

  );
};

export default TransactionList;