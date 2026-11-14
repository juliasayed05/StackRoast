import { useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  TerminalSquare,
  UserRound,
  X,
} from "lucide-react";

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
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
            {/* Close */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Close confirmation"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <LogOut size={26} />
            </div>

            {/* Content */}
            <h2
              id="logout-title"
              className="text-center text-xl font-extrabold text-slate-900 dark:text-white"
            >
              Confirm Logout
            </h2>

            <p className="mt-2 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Are you sure you want to log out of your StackRoast account?
            </p>

            {/* Buttons */}
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
