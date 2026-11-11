
import { useWallet } from "../context/WalletContext";

const WalletCard = ({ card, showBalance }) => {
  const { balance } = useWallet();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 md:p-7 text-white shadow-xl ${card.background}`}
    >
      {/* Decorative circles */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -right-5 -bottom-20 h-48 w-48 rounded-full bg-white/10" />

      <div className="relative z-10">

        {/* Card Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold md:text-lg">
            {card.bank}
          </h3>

          <span className="text-xl font-bold italic md:text-2xl">
            {card.type}
          </span>
        </div>

        {/* Card Balance */}
        <div className="mt-8">
          <p className="text-xs text-white/70 md:text-sm">
            Card Balance
          </p>

          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            {showBalance
              ? `₹${Number(balance).toLocaleString("en-IN")}`
              : "₹••••••"}
          </h2>
        </div>

        {/* Card Footer */}
        <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          {/* Card Holder */}
          <div>
            <p className="text-xs text-white/60">
              CARD HOLDER
            </p>

            <p className="mt-1 font-semibold">
              {showBalance ? card.holder : "••••••••"}
            </p>
          </div>

          {/* Card Number */}
          <div className="text-left sm:text-right">
            <p className="text-xs text-white/60">
              CARD NUMBER
            </p>

            <p className="mt-1 font-semibold">
              {showBalance
                ? `•••• ${card.number}`
                : "•••• ••••"}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WalletCard;
