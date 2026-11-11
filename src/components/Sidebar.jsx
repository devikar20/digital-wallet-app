
const Sidebar = ({ activePage, onNavigate }) => {
  const menuItems = [
    { icon: "⌂", name: "Dashboard" },
    { icon: "▣", name: "My Cards" },
    { icon: "↔", name: "Transactions" },
    { icon: "◷", name: "History" },
    { icon: "⚙", name: "Settings" },
  ];

  return (
    <aside className="w-full border-r border-gray-100 bg-white p-6 lg:min-h-screen lg:w-64">

      <h1 className="mb-10 text-2xl font-extrabold text-indigo-600">
        Wallet<span className="text-gray-800">Pay.</span>
      </h1>

      <p className="mb-5 text-xs uppercase tracking-widest text-gray-400">
        Menu
      </p>

      <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => onNavigate(item.name)}
            className={`flex w-full min-w-fit items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
              activePage === item.name
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="mt-16 hidden rounded-2xl bg-indigo-50 p-5 lg:block">
        <div className="mb-3 text-3xl">💳</div>

        <h3 className="font-bold text-gray-800">
          Manage your money
        </h3>

        <p className="mt-2 text-xs text-gray-500">
          Your money, your control. Manage all your finances in one place.
        </p>
      </div>

    </aside>
  );
};

export default Sidebar;
