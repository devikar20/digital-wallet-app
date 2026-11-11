import { useWallet } from "../context/WalletContext";

const WalletCard = ({ card, showBalance }) => {

  const { balance } = useWallet();

  return (

    <div
      className={`relative overflow-hidden rounded-2xl p-5 md:p-7 text-white shadow-xl ${card.background}`}
    >

      {/* Decorative circles */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full"></div>

      <div className="absolute -right-5 -bottom-20 w-48 h-48 bg-white/10 rounded-full"></div>

      <div className="relative z-10">

        {/* Card Header */}
        <div className="flex items-center justify-between">

          <h3 className="font-semibold text-base md:text-lg">
            {card.bank}
          </h3>

          <span className="text-xl md:text-2xl font-bold italic">
            {card.type}
          </span>

        </div>


        {/* Card Balance */}
        <div className="mt-8">

          <p className="text-white/70 text-xs md:text-sm">
            Card Balance
          </p>

          <h2 className="text-2xl md:text-3xl font-bold mt-2">

            {showBalance
              ? `₹${balance.toLocaleString("en-IN")}`
              : "₹ ••••••"}

          </h2>

        </div>


        {/* Card Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mt-10">

          <div>

            <p className="text-white/60 text-xs">
              CARD HOLDER
            </p>

            <p className="font-semibold mt-1">
              {card.holder}
            </p>

          </div>


          <div>

            <p className="text-white/60 text-xs">
              CARD NUMBER
            </p>

            <p className="font-semibold mt-1">
              •••• {card.number}
            </p>

          </div>

        </div>

      </div>

    </div>

  );
};

export default WalletCard;