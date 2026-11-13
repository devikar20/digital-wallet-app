
import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

export default function NotificationCenter() {
  const {
    notifications,
    connected,
    clearNotifications,
    dismissNotification,
  } = useSocket();

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const lastNotificationId = useRef(null);

  // Automatically display new notifications
  useEffect(() => {
    if (notifications.length === 0) return;

    const latest = notifications[0];

    if (latest.id === lastNotificationId.current) return;

    lastNotificationId.current = latest.id;
    setToast(latest);
  }, [notifications]);

  // Automatically hide popup after 5 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <>
      {/* AUTOMATIC POPUP */}
      {toast && (
        <div className="fixed right-5 top-5 z-[100] w-80 animate-in slide-in-from-right duration-300 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl">
              🔔
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800">
                {toast.title || "New Transaction"}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {toast.message}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                {toast.createdAt
                  ? new Date(toast.createdAt).toLocaleTimeString()
                  : "Just now"}
              </p>
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATION BELL */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:bg-gray-50"
          title="Notifications"
        >
          <span className="text-xl">🔔</span>

          {notifications.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
              {notifications.length}
            </span>
          )}
        </button>

        {/* NOTIFICATION HISTORY */}
        {open && (
          <div className="absolute right-0 top-14 z-50 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Notifications
              </h3>

              <button
                onClick={clearNotifications}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear all
              </button>
            </div>

            <p className="mb-3 text-xs text-gray-500">
              Socket status: {connected ? "Connected" : "Disconnected"}
            </p>

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">
                        {item.title}
                      </p>

                      <button
                        onClick={() => dismissNotification(item.id)}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {item.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleTimeString()
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
