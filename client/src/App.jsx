import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Flame,
  SlidersHorizontal,
  Sparkles,
  Code2,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import Navbar from "./components/Navbar.jsx";
import AuthModal from "./components/AuthModal.jsx";
import CreatePostModal from "./components/CreatePostModal.jsx";
import PostDetailModal from "./components/PostDetailModal.jsx";
import PostCard from "./components/PostCard.jsx";
import Toast from "./components/Toast.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import ResetPasswordPage from "./components/ResetPasswordPage.jsx";
import { api, TOKEN_KEY_NAME } from "./lib/api.js";

const TAGS = [
  "All",
  "React",
  "Node.js",
  "Python",
  "Database",
  "UI/UX",
  "Architecture",
];
const SORTS = [
  ["newest", "Newest"],
  ["top", "Most roasted"],
  ["expiring", "Expiring soon"],
];

function getInitialTheme() {
  const saved = window.localStorage.getItem("stackroast_theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tag, setTag] = useState("All");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("active");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [feedVersion, setFeedVersion] = useState(0);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    window.localStorage.getItem(TOKEN_KEY_NAME),
  );
  const [authMode, setAuthMode] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [adminView, setAdminView] = useState(false);

  const showToast = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, type }].slice(-4));
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      3600,
    );
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;
    const onSystemThemeChange = (event) => {
      if (!window.localStorage.getItem("stackroast_theme"))
        setTheme(event.matches ? "dark" : "light");
    };
    media.addEventListener?.("change", onSystemThemeChange);
    return () => media.removeEventListener?.("change", onSystemThemeChange);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      280,
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const storedToken = window.localStorage.getItem(TOKEN_KEY_NAME);
    if (!storedToken) {
      setUser(null);
      setToken(null);
      return () => {
        active = false;
      };
    }

    api
      .get("/auth/me")
      .then((result) => {
        if (!active) return;
        setUser(result.user);
        setToken(storedToken);
      })
      .catch((error) => {
        if (!active) return;
        window.localStorage.removeItem(TOKEN_KEY_NAME);
        setUser(null);
        setToken(null);
        if (error.status === 401)
          showToast("Session expired. Please sign in again.", "error");
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      search: debouncedSearch,
      tag: tag === "All" ? "all" : tag,
      sort,
      status,
    });
    setLoading(true);
    setFeedError("");
    api
      .get(`/posts?${params.toString()}`)
      .then((result) => {
        if (!active) return;
        setPosts(result.posts || []);
      })
      .catch((error) => {
        if (!active) return;
        setFeedError(error.message);
        setPosts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedSearch, tag, sort, status, feedVersion, token]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("stackroast_theme", next);
      return next;
    });
  }, []);

  function handleAuthenticated(result) {
    window.localStorage.setItem(TOKEN_KEY_NAME, result.token);
    setToken(result.token);
    setUser(result.user);
    setAuthMode(null);
    showToast(`Welcome ${result.user.username}`, "success");
    setFeedVersion((current) => current + 1);
  }

  function openNewPost() {
    if (!user) {
      setAuthMode("login");
      return;
    }
    setCreateOpen(true);
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY_NAME);
    setToken(null);
    setUser(null);
    setAdminView(false);
    showToast("You have been logged out.", "info");
    setFeedVersion((current) => current + 1);
  }

  async function upvotePost(postId) {
    if (!user) {
      setAuthMode("login");
      return;
    }
    try {
      await api.patch(`/posts/${postId}/upvote`);
      setFeedVersion((current) => current + 1);
    } catch (error) {
      if (error.status === 401) setAuthMode("login");
      showToast(error.message, "error");
    }
  }

  function handlePostCreated() {
    setCreateOpen(false);
    setStatus("active");
    setSort("newest");
    setTag("All");
    setFeedVersion((current) => current + 1);
    showToast("Your roast is live. Let the feedback roll in.", "success");
  }

  function handlePostDeleted() {
    setSelectedPostId(null);
    setFeedVersion((current) => current + 1);
  }

  const activeCount = useMemo(
    () =>
      posts.filter(
        (post) =>
          !post.isExpired && new Date(post.expiresAt).getTime() > Date.now(),
      ).length,
    [posts],
  );
  if (window.location.pathname === "/reset-password") {
    return <ResetPasswordPage />;
  }

  return (
    <div
      id="top"
      className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0B0F19] dark:text-slate-100"
    >
      <Navbar
        search={search}
        onSearch={setSearch}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onLogin={() => setAuthMode("login")}
        onRegister={() => setAuthMode("register")}
        onLogout={logout}
        onNewPost={openNewPost}
        onAdmin={() => setAdminView(true)}
      />

      {adminView && user?.isAdmin ? (
        <AdminDashboard
          onBack={() => setAdminView(false)}
          onToast={showToast}
        />
      ) : (
        <main className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-10">
          <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 font-label text-[9px] uppercase tracking-[0.16em] text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300">
                <Sparkles size={12} /> Developer feedback, unfiltered
              </div>
              <h1 className="max-w-3xl text-[34px] font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-[42px]">
                Ship code. Get roasted.
                <br className="hidden sm:block" />{" "}
                <span className="text-orange-500">Come back sharper.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                A no-ego space for developers to share work, get honest
                feedback, and turn rough edges into better software.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:w-[340px]">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-[#111827]">
                <div className="flex items-center gap-1.5 text-orange-500">
                  <Flame size={14} />
                  <span className="font-label text-[9px] uppercase tracking-wider">
                    In view
                  </span>
                </div>
                <p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {posts.length}
                </p>
                <p className="text-[10px] text-slate-400">roasts</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-[#111827]">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="font-label text-[9px] uppercase tracking-wider">
                    Live now
                  </span>
                </div>
                <p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {activeCount}
                </p>
                <p className="text-[10px] text-slate-400">active in view</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-[#111827]">
                <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                  <ShieldCheck size={13} />
                  <span className="font-label text-[9px] uppercase tracking-wider">
                    Private
                  </span>
                </div>
                <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
                  Optional
                </p>
                <p className="text-[10px] text-slate-400">anonymous posting</p>
              </div>
            </div>
          </section>

          <section aria-label="Roast feed">
            <div className="mb-4 flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {TAGS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTag(item)}
                    aria-pressed={tag === item}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${tag === item ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900" : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 dark:border-slate-800 dark:bg-[#111827]">
                  <SlidersHorizontal size={13} className="text-slate-400" />
                  <span className="hidden text-[10px] font-semibold text-slate-400 sm:inline">
                    SORT
                  </span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="max-w-[130px] bg-transparent text-xs font-bold text-slate-700 outline-none dark:text-slate-200"
                    aria-label="Sort posts"
                  >
                    {SORTS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div
                  className="flex h-9 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-[#111827]"
                  role="group"
                  aria-label="Post status filter"
                >
                  {["active", "expired"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatus(value)}
                      aria-pressed={status === value}
                      className={`rounded-md px-3 text-[11px] font-bold capitalize transition ${status === value ? "bg-orange-500 text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {status === "active" ? "Live roasts" : "Expired roasts"}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {debouncedSearch
                    ? `Results for “${debouncedSearch}”`
                    : "Real projects. Real feedback. No sugar-coating."}
                </p>
              </div>
              <span className="font-label text-[10px] tracking-wider text-slate-400">
                {posts.length.toString().padStart(2, "0")} FOUND
              </span>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-[290px] animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]"
                  >
                    <div className="m-5 h-4 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mx-5 mt-6 h-5 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mx-5 mt-3 h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mx-5 mt-2 h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mx-5 mt-8 h-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : feedError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                  Could not load the feed
                </p>
                <p className="mt-2 text-xs text-rose-600/80 dark:text-rose-300/70">
                  {feedError}
                </p>
                <button
                  type="button"
                  onClick={() => setFeedVersion((current) => current + 1)}
                  className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Try again
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/30">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <Code2 size={22} />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {status === "active"
                    ? "Nothing is cooking yet."
                    : "No expired roasts found."}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {debouncedSearch || tag !== "All"
                    ? "Try a different search or tag filter."
                    : "Be the first to share a project and invite the community to review it."}
                </p>
                {status === "active" && (
                  <button
                    type="button"
                    onClick={openNewPost}
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white hover:bg-orange-600"
                  >
                    <MessageSquare size={14} /> Start a roast
                  </button>
                )}
              </div>
            ) : (
              <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onOpen={setSelectedPostId}
                    onUpvote={upvotePost}
                    onToast={showToast}
                    onExpired={() => setFeedVersion((current) => current + 1)}
                  />
                ))}
              </div>
            )}
          </section>

          <footer className="mt-16 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 text-center dark:border-slate-800 sm:flex-row sm:text-left">
            <p className="text-[11px] text-slate-400">
              StackRoast <span className="mx-1">·</span> Better feedback, better
              software.
            </p>
            <p className="font-label text-[9px] uppercase tracking-[0.16em] text-slate-400">
              Built for the craft
            </p>
          </footer>
        </main>
      )}

      {createOpen && user && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onCreated={handlePostCreated}
          onRequireAuth={() => setAuthMode("login")}
        />
      )}
      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          user={user}
          onClose={() => setSelectedPostId(null)}
          onRequireAuth={() => setAuthMode("login")}
          onToast={showToast}
          onChanged={() => setFeedVersion((current) => current + 1)}
          onDeleted={handlePostDeleted}
        />
      )}
      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onAuthenticated={handleAuthenticated}
          onModeChange={setAuthMode}
        />
      )}
      <Toast toasts={toasts} />
    </div>
  );
}
