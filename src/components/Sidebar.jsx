
const Sidebar = ({ activePage, onNavigate }) => {
  const menuItems = [
    { icon: "⌂", name: "Dashboard" },
    { icon: "▣", name: "My Cards" },
    { icon: "↔", name: "Transactions" },
    { icon: "◷", name: "History" },
    { icon: "⚙", name: "Settings" },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-gray-100 p-6 lg:min-h-screen">

      <h1 className="text-2xl font-extrabold text-primary mb-10">
        Wallet<span className="text-gray-800">Pay.</span>
      </h1>

      <p className="text-xs text-gray-400 uppercase tracking-widest mb-5">
        Menu
      </p>

      <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => onNavigate(item.name)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl min-w-fit transition w-full text-left ${
              activePage === item.name
                ? "bg-primary text-white shadow-lg shadow-indigo-200"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium text-sm">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="hidden lg:block mt-16 bg-indigo-50 rounded-2xl p-5">
        <div className="text-3xl mb-3">💳</div>

        <h3 className="font-bold text-gray-800">
          Manage your money
        </h3>

        <p className="text-xs text-gray-500 mt-2">
          Your money, your control. Manage all your finances in one place.
        </p>
      </div>

    </aside>
  );
};

export default Sidebar;
