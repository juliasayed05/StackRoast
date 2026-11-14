import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Sun,
  TerminalSquare,
  ThumbsUp,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { api } from "../lib/api.js";

function getNotificationMessage(notification) {
  const actor = notification.actor?.label || "Someone";

  switch (notification.type) {
    case "post_comment":
      return `${actor} commented on your roast.`;
    case "post_upvote":
      return `${actor} upvoted your roast.`;
    case "comment_upvote":
      return `${actor} upvoted your feedback.`;
    default:
      return `${actor} interacted with your content.`;
  }
}

function formatNotificationDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function Navbar({
  search,
  onSearch,
  onSearchSubmit,
  theme,
  onToggleTheme,
  user,
  onLogin,
  onRegister,
  onLogout,
  onNewPost,
  onAdmin,
  onProfile,
  onOpenPost,
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const notificationPanelRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const result = await api.get("/notifications/unread-count");
      setUnreadCount(Number(result.unreadCount) || 0);
    } catch (error) {
      console.error("Unable to fetch notification count:", error);
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setNotificationsLoading(true);
    setNotificationError("");

    try {
      const result = await api.get("/notifications?page=1&limit=20");

      setNotifications(result.notifications || []);
      setUnreadCount(Number(result.unreadCount) || 0);
    } catch (error) {
      setNotificationError(error.message || "Unable to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false);
      return;
    }

    fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (!showNotifications) return undefined;

    function handleOutsideClick(event) {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showNotifications]);

  const handleToggleNotifications = () => {
    const nextOpen = !showNotifications;

    setShowNotifications(nextOpen);

    if (nextOpen) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      setNotificationError(error.message || "Unable to update notification.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );

      setUnreadCount(0);
    } catch (error) {
      setNotificationError(error.message || "Unable to update notifications.");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    const notification = notifications.find(
      (item) => item.id === notificationId,
    );

    try {
      await api.delete(`/notifications/${notificationId}`);

      setNotifications((current) =>
        current.filter((item) => item.id !== notificationId),
      );

      if (notification && !notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      setNotificationError(error.message || "Unable to delete notification.");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }

    setShowNotifications(false);

    if (notification.post?.id && onOpenPost) {
      onOpenPost(notification.post.id);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#080C14]/95">
        <div className="mx-auto flex min-h-[60px] max-w-[1440px] items-center gap-1 px-2 py-2 sm:min-h-[72px] sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
          {/* Logo */}
          <a
            href="#top"
            className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2.5"
            aria-label="StackRoast home"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/20 sm:h-9 sm:w-9">
              <TerminalSquare size={18} strokeWidth={2.2} />
            </span>

            <span className="whitespace-nowrap text-[14px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[17px]">
              Stack<span className="text-orange-500">Roast</span>
            </span>
          </a>

          {/* Desktop Search */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit();
            }}
            className="relative mx-auto hidden max-w-[510px] flex-1 items-center gap-2 md:flex"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Search roasts, code, ideas..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500"
                aria-label="Search roasts"
              />
            </div>

            <button
              type="submit"
              className="h-10 shrink-0 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              Search
            </button>
          </form>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 sm:h-9 sm:w-9"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* New Roast */}
            <button
              type="button"
              onClick={onNewPost}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg bg-orange-500 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 sm:h-9 sm:gap-2 sm:rounded-xl sm:px-3.5 sm:text-sm"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">New Roast</span>
              <span className="sm:hidden">New</span>
            </button>

            {user ? (
              <div className="flex shrink-0 items-center gap-1 border-l border-slate-200 pl-1.5 dark:border-slate-700 sm:gap-2 sm:pl-3">
                {/* Notification Center */}
                <div className="relative" ref={notificationPanelRef}>
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-orange-500/10 sm:h-9 sm:w-9"
                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                    aria-expanded={showNotifications}
                    title="Notifications"
                  >
                    <Bell size={17} />

                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[9px] font-extrabold leading-none text-white dark:border-[#080C14]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="fixed left-2 right-2 top-[66px] z-[60] max-h-[min(75vh,620px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-[#111827] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[390px]">
                      {/* Panel Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <div>
                          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Notifications
                          </h2>

                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {unreadCount} unread
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-orange-600 transition hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-500/10"
                            >
                              <CheckCheck size={14} />
                              <span>Read all</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowNotifications(false)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                            aria-label="Close notifications"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Notification List */}
                      <div className="max-h-[min(65vh,520px)] overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                            Loading notifications...
                          </div>
                        ) : notificationError ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-sm text-rose-500">
                              {notificationError}
                            </p>

                            <button
                              type="button"
                              onClick={fetchNotifications}
                              className="mt-3 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
                            >
                              Try again
                            </button>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-10 text-center">
                            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                              <Bell size={20} />
                            </span>

                            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                              You're all caught up
                            </p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              New activity on your roasts will appear here.
                            </p>
                          </div>
                        ) : (
                          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {notifications.map((notification) => (
                              <li
                                key={notification.id}
                                className={`group relative flex gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                  notification.isRead
                                    ? "bg-white dark:bg-[#111827]"
                                    : "bg-orange-50/70 dark:bg-orange-500/[0.06]"
                                }`}
                              >
                                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                                  {notification.type === "post_comment" ? (
                                    <MessageSquare size={16} />
                                  ) : (
                                    <ThumbsUp size={16} />
                                  )}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <p className="pr-1 text-xs leading-relaxed text-slate-800 dark:text-slate-100">
                                    {getNotificationMessage(notification)}
                                  </p>

                                  {notification.post?.title && (
                                    <p className="mt-1 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                      {notification.post.title}
                                    </p>
                                  )}

                                  <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                                    {formatNotificationDate(
                                      notification.createdAt,
                                    )}
                                  </p>
                                </button>

                                <div className="flex shrink-0 flex-col items-center gap-1">
                                  {!notification.isRead && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMarkRead(notification.id)
                                      }
                                      className="rounded-md p-1 text-slate-400 transition hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
                                      title="Mark as read"
                                      aria-label="Mark notification as read"
                                    >
                                      <Check size={14} />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteNotification(notification.id)
                                    }
                                    className="rounded-md p-1 text-slate-400 opacity-100 transition hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 sm:opacity-0 sm:group-hover:opacity-100"
                                    title="Delete notification"
                                    aria-label="Delete notification"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin */}
                {user.isAdmin && (
                  <button
                    type="button"
                    onClick={onAdmin}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-200 text-orange-700 transition hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/10 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-2.5"
                    title="Open admin dashboard"
                    aria-label="Admin dashboard"
                  >
                    <LayoutDashboard size={15} />
                    <span className="hidden lg:inline">Admin</span>
                  </button>
                )}

                {/* Username */}
                <div className="hidden text-right sm:block">
                  <p className="max-w-[110px] truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    @{user.username}
                  </p>

                  <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Developer
                  </p>
                </div>

                {/* Profile */}
                <button
                  type="button"
                  onClick={onProfile}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-orange-500/10 sm:h-9 sm:w-auto sm:gap-1.5 sm:rounded-xl sm:px-2.5"
                  title="View your profile"
                  aria-label="View profile"
                >
                  <UserRound size={16} />
                  <span className="hidden md:inline">Profile</span>
                </button>

                {/* Logout */}
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-1 border-l border-slate-200 pl-1.5 dark:border-slate-700 sm:gap-1.5 sm:pl-3">
                <button
                  type="button"
                  onClick={onLogin}
                  className="rounded-lg px-1.5 py-2 text-[11px] font-bold text-slate-600 transition hover:text-orange-600 dark:text-slate-200 sm:px-2 sm:text-xs"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={onRegister}
                  className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:text-slate-200 sm:block"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="px-3 pb-3 md:hidden sm:px-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit();
            }}
            className="flex gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Search roasts, code, ideas..."
                aria-label="Search roasts"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              className="h-9 shrink-0 rounded-xl bg-orange-500 px-3 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              Search
            </button>
          </form>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#111827]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Close confirmation"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <LogOut size={26} />
            </div>

            <h2
              id="logout-title"
              className="text-center text-xl font-extrabold text-slate-900 dark:text-white"
            >
              Confirm Logout
            </h2>

            <p className="mt-2 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Are you sure you want to log out of your StackRoast account?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
