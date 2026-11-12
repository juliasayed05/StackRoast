import {
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  TerminalSquare,
} from "lucide-react";

export default function Navbar({
  search,
  onSearch,
  theme,
  onToggleTheme,
  user,
  onLogin,
  onRegister,
  onLogout,
  onNewPost,
  onAdmin,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#080C14]/95">
      <div className="mx-auto flex min-h-[64px] max-w-[1440px] items-center gap-2 px-3 py-2 sm:h-[72px] sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
        {/* Logo */}
        <a
          href="#top"
          className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5"
          aria-label="StackRoast home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/20">
            <TerminalSquare size={19} strokeWidth={2.2} />
          </span>

          <span className="whitespace-nowrap text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[17px]">
            Stack<span className="text-orange-500">Roast</span>
          </span>
        </a>

        {/* Desktop Search */}
        <div className="relative mx-auto hidden max-w-[510px] flex-1 md:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />

          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search roasts, code, ideas..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700/80 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-500 dark:focus:bg-[#111827]"
            aria-label="Search roasts"
          />

          <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 font-label text-[10px] text-slate-400 dark:text-slate-500 lg:block">
            LIVE SEARCH
          </span>
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-[#1A2435]"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* New Roast */}
          <button
            type="button"
            onClick={onNewPost}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-orange-500 px-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 sm:gap-2 sm:px-3.5 sm:text-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">New Roast</span>
            <span className="sm:hidden">New</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 dark:border-slate-700 sm:pl-3">
              {user.isAdmin && (
                <button
                  type="button"
                  onClick={onAdmin}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-orange-200 px-2.5 text-xs font-bold text-orange-700 transition hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/10"
                  title="Open admin dashboard"
                >
                  <LayoutDashboard size={14} />
                  <span className="hidden lg:inline">Admin</span>
                </button>
              )}

              <div className="hidden text-right sm:block">
                <p className="max-w-[110px] truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                  @{user.username}
                </p>
                <p className="font-label text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Developer
                </p>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 dark:border-slate-700 sm:gap-1.5 sm:pl-3">
              <button
                type="button"
                onClick={onLogin}
                className="rounded-lg px-1.5 py-2 text-[11px] font-bold text-slate-600 transition hover:text-orange-600 dark:text-slate-200 dark:hover:text-orange-400 sm:px-2 sm:text-xs"
              >
                Login
              </button>

              <button
                type="button"
                onClick={onRegister}
                className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-orange-500/50 dark:hover:text-orange-400 sm:block"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="px-3 pb-3 md:hidden sm:px-6">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />

          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search roasts, code, ideas..."
            aria-label="Search roasts"
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-500"
          />
        </div>
      </div>
    </header>
  );
}
