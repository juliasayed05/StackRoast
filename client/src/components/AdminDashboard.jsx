import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Flame,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Users,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api.js";

const card =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111827]";
const button =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

export default function AdminDashboard({ onBack, onToast }) {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsPages, setPostsPages] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsStatus, setPostsStatus] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [suspendingUserId, setSuspendingUserId] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userStatus, setUserStatus] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summary, userResult, postResult] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users?page=1&status=all"),
        api.get(`/admin/posts?page=1&status=${postsStatus}`),
      ]);
      setData(summary);
      setUsers(userResult.users || []);
      setUserPage(userResult.page || 1);
      setUserPages(userResult.pages || 1);
      setUserTotal(userResult.total || 0);
      setPosts(postResult.posts || []);
      setPostsPage(postResult.page || 1);
      setPostsPages(postResult.pages || 1);
      setPostsTotal(postResult.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postsStatus]);
  useEffect(() => {
    load();
  }, [load]);

  const fetchPosts = useCallback(
    async (page = 1, status = postsStatus) => {
      setLoadingPosts(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          status,
        });
        const result = await api.get(`/admin/posts?${params.toString()}`);
        setPosts(result.posts || []);
        setPostsPage(result.page || 1);
        setPostsPages(result.pages || 1);
        setPostsTotal(result.total || 0);
      } catch (err) {
        onToast(err.message || "Unable to load posts.", "error");
      } finally {
        setLoadingPosts(false);
      }
    },
    [postsStatus, onToast],
  );

  async function removePost(id) {
    if (
      !window.confirm(
        "Delete this post and all of its comments? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/admin/posts/${id}`);
      onToast("Post and comments deleted.", "success");
      await load();
    } catch (err) {
      onToast(err.message, "error");
    }
  }

  async function removeUser(id, username) {
    const confirmed = window.confirm(
      `Are you sure you want to delete @${username}?\n\nThis action cannot be undone. Their posts and comments will be preserved.`,
    );

    if (!confirmed) return;

    try {
      setDeletingUserId(id);

      await api.delete(`/admin/users/${id}`);

      onToast(`User @${username} deleted successfully.`, "success");

      await searchUsers(userSearch, userPage);
    } catch (err) {
      onToast(err.message || "Failed to delete user.", "error");
    } finally {
      setDeletingUserId(null);
    }
  }
  async function toggleUserSuspension(user) {
    const shouldSuspend = !user.isSuspended;
    const action = shouldSuspend ? "suspend" : "restore access for";

    const confirmed = window.confirm(
      shouldSuspend
        ? `Suspend @${user.username}? They will not be able to sign in or use their account. Their profile, posts, and comments will remain saved.`
        : `Restore access for @${user.username}? They will be able to sign in and use their account again.`,
    );

    if (!confirmed) return;

    try {
      setSuspendingUserId(user.id);
      await api.patch(`/admin/users/${user.id}/suspension`, {
        suspended: shouldSuspend,
      });

      onToast(
        shouldSuspend
          ? `@${user.username} has been suspended. Their data was preserved.`
          : `Access restored for @${user.username}.`,
        "success",
      );

      await searchUsers(userSearch, userPage);
    } catch (err) {
      onToast(err.message || `Unable to ${action} this user.`, "error");
    } finally {
      setSuspendingUserId(null);
    }
  }

  async function toggleResolved(id) {
    try {
      await api.patch(`/admin/posts/${id}/resolve`);
      onToast("Post status updated.", "success");
      await load();
    } catch (err) {
      onToast(err.message, "error");
    }
  }

  const stats = data?.stats;
  const metricItems = [
    ["Total users", stats?.users, Users],
    ["Total posts", stats?.posts, Flame],
    ["Active posts", stats?.activePosts, Activity],
    ["Expired posts", stats?.expiredPosts, Clock3],
    ["Comments", stats?.comments, MessageSquare],
    ["Resolved", stats?.resolvedPosts, CheckCircle2],
  ];
  const searchUsers = useCallback(
    async (search = userSearch, page = 1, status = userStatus) => {
      setSearchingUsers(true);

      try {
        const params = new URLSearchParams({
          search: search.trim(),
          page: String(page),
          status,
        });

        const result = await api.get(`/admin/users?${params.toString()}`);

        setUsers(result.users || []);
        setUserPage(result.page || 1);
        setUserPages(result.pages || 1);
        setUserTotal(result.total || 0);
      } catch (err) {
        onToast(err.message || "Unable to search users.", "error");
      } finally {
        setSearchingUsers(false);
      }
    },
    [userSearch, userStatus, onToast],
  );

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300">
            <Shield size={12} /> Admin workspace
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor StackRoast activity and moderate community content.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            className={`${button} min-h-10 flex-1 justify-center sm:flex-none`}
            onClick={onBack}
          >
            <ArrowLeft size={14} /> Back to feed
          </button>
          <button
            className={`${button} min-h-10 flex-1 justify-center sm:flex-none`}
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[
          ["overview", "Overview"],
          ["posts", "Manage posts"],
          ["users", "Users"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`min-h-10 shrink-0 rounded-lg px-4 py-2 text-xs font-bold ${tab === value ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {error}{" "}
          <button className="ml-2 font-bold underline" onClick={load}>
            Try again
          </button>
        </div>
      )}
      {loading && !data ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading admin data…
        </div>
      ) : (
        <>
          {tab === "overview" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {metricItems.map(([label, value, Icon]) => (
                  <div className={card} key={label}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {label}
                      </span>
                      <Icon size={17} className="text-orange-500" />
                    </div>
                    <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-950 dark:text-white">
                      {value ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
              <section className={`${card} mt-6`}>
                <h2 className="mb-4 text-sm font-extrabold text-slate-900 dark:text-white">
                  Recent posts
                </h2>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data?.recentPosts || []).map((post) => (
                    <div
                      key={post.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {post.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {post.author} ·{" "}
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {post.resolved && (
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Resolved
                          </span>
                        )}
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {post.expired ? "Expired" : "Active"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
          {tab === "posts" && (
            <section className={card}>
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Manage posts ({postsTotal})
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    View every community post, including active, expired,
                    resolved, and unresolved posts. Use pagination to browse the
                    full list.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "View All Posts"],
                    ["active", "Active"],
                    ["expired", "Expired"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setPostsStatus(value);
                        fetchPosts(1, value);
                      }}
                      disabled={loadingPosts}
                      className={`min-h-9 rounded-lg px-3 py-2 text-xs font-bold ${
                        postsStatus === value
                          ? "bg-orange-500 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingPosts ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Loading posts…
                </p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                                post.isExpired
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              }`}
                            >
                              {post.isExpired ? "Expired" : "Active"}
                            </span>
                            {post.isResolved && (
                              <span className="rounded-md bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                                Resolved
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            {post.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-slate-500">
                            {post.description}
                          </p>
                          <p className="mt-2 text-[11px] text-slate-400">
                            {post.author} · {post.votes} votes ·{" "}
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                          {!!post.tags?.length && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:flex-col">
                          <button
                            type="button"
                            className={`${button} min-h-10 flex-1 justify-center sm:flex-none`}
                            onClick={() => setSelectedPost(post)}
                          >
                            <Eye size={14} /> Open Post
                          </button>
                          <button
                            type="button"
                            className={`${button} min-h-10 flex-1 justify-center sm:flex-none`}
                            onClick={() => toggleResolved(post.id)}
                          >
                            {post.isResolved ? "Unresolve" : "Resolve"}
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30 sm:flex-none"
                            onClick={() => removePost(post.id)}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {posts.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No {postsStatus === "all" ? "" : `${postsStatus} `}posts
                      found.
                    </p>
                  )}
                </div>
              )}

              {postsPages > 1 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-xs text-slate-500">
                    Page {postsPage} of {postsPages} · {postsTotal} posts
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={postsPage <= 1 || loadingPosts}
                      onClick={() => fetchPosts(postsPage - 1)}
                      className={button}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      type="button"
                      disabled={postsPage >= postsPages || loadingPosts}
                      onClick={() => fetchPosts(postsPage + 1)}
                      className={button}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === "users" && (
            <section className={card}>
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Registered users ({userTotal})
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Search users by username, email, or display name.
                  </p>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    searchUsers(userSearch, 1);
                  }}
                  className="flex w-full gap-2 sm:max-w-md"
                >
                  <div className="relative min-w-0 flex-1">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search username or email..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-[#080C14] dark:text-white"
                    />

                    {userSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearch("");
                          searchUsers("", 1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                        aria-label="Clear search"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={searchingUsers}
                    className="h-10 shrink-0 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {searchingUsers ? "Searching..." : "Search"}
                  </button>
                </form>
              </div>

              <div
                className="mb-5 flex flex-wrap gap-2"
                aria-label="Filter users by account status"
              >
                {[
                  ["all", "All Users"],
                  ["active", "Active Users"],
                  ["suspended", "Suspended Users"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setUserStatus(value);
                      searchUsers(userSearch, 1, value);
                    }}
                    disabled={searchingUsers}
                    aria-pressed={userStatus === value}
                    className={`min-h-9 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${
                      userStatus === value
                        ? "bg-orange-500 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-3 sm:hidden">
                {users.map((u) => (
                  <article
                    key={u.id}
                    className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                        @{u.username}
                      </p>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold dark:bg-slate-800">
                        {u.role}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {u.email}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold ${
                          u.isSuspended
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {u.isSuspended ? "Suspended" : "Active account"}
                      </span>
                    </div>
                    {u.role !== "admin" && (
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          disabled={
                            suspendingUserId === u.id || deletingUserId === u.id
                          }
                          onClick={() => toggleUserSuspension(u)}
                          className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${
                            u.isSuspended
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                              : "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
                          }`}
                        >
                          {u.isSuspended ? (
                            <ShieldCheck size={14} />
                          ) : (
                            <ShieldAlert size={14} />
                          )}
                          {suspendingUserId === u.id
                            ? "Please wait..."
                            : u.isSuspended
                              ? "Unsuspend User"
                              : "Suspend User"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            deletingUserId === u.id || suspendingUserId === u.id
                          }
                          onClick={() => removeUser(u.id, u.username)}
                          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 size={14} />
                          {deletingUserId === u.id
                            ? "Deleting..."
                            : "Delete User"}
                        </button>
                      </div>
                    )}
                  </article>
                ))}
                {users.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No users found.
                  </p>
                )}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Joined</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-100">
                          @{u.username}
                        </td>
                        <td className="py-3 text-slate-500">{u.email}</td>
                        <td className="py-3">
                          <span className="rounded-md bg-slate-100 px-2 py-1 font-bold dark:bg-slate-800">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                              u.isSuspended
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            }`}
                          >
                            {u.isSuspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          {u.role !== "admin" && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={
                                  suspendingUserId === u.id ||
                                  deletingUserId === u.id
                                }
                                onClick={() => toggleUserSuspension(u)}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${
                                  u.isSuspended
                                    ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                                    : "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
                                }`}
                              >
                                {u.isSuspended ? (
                                  <ShieldCheck size={13} />
                                ) : (
                                  <ShieldAlert size={13} />
                                )}
                                {suspendingUserId === u.id
                                  ? "Wait..."
                                  : u.isSuspended
                                    ? "Unsuspend"
                                    : "Suspend"}
                              </button>
                              <button
                                type="button"
                                disabled={
                                  deletingUserId === u.id ||
                                  suspendingUserId === u.id
                                }
                                onClick={() => removeUser(u.id, u.username)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 size={13} />
                                {deletingUserId === u.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No users found.
                  </p>
                )}
              </div>

              {userPages > 1 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-xs text-slate-500">
                    Page {userPage} of {userPages} · {userTotal} users
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={userPage <= 1 || searchingUsers}
                      onClick={() => searchUsers(userSearch, userPage - 1)}
                      className={button}
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={userPage >= userPages || searchingUsers}
                      onClick={() => searchUsers(userSearch, userPage + 1)}
                      className={button}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {selectedPost && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPost(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-post-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#111827] sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                  Full post details
                </p>
                <h2
                  id="admin-post-title"
                  className="mt-1 text-xl font-extrabold text-slate-950 dark:text-white"
                >
                  {selectedPost.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                aria-label="Close post details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-bold">
              <span
                className={`rounded-md px-2 py-1 ${selectedPost.isExpired ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}
              >
                {selectedPost.isExpired ? "Expired" : "Active"}
              </span>
              {selectedPost.isResolved && (
                <span className="rounded-md bg-sky-50 px-2 py-1 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                  Resolved
                </span>
              )}
              <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {selectedPost.isAnonymous
                  ? "Anonymous author"
                  : `@${selectedPost.author}`}
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Description
                </h3>
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {selectedPost.description}
                </p>
              </div>

              {!!selectedPost.tags?.length && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!!selectedPost.codeSnippet && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Code snippet · {selectedPost.codeLanguage || "text"}
                  </h3>
                  <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                    <code>{selectedPost.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {!!selectedPost.liveUrl && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Live URL
                  </h3>
                  <a
                    href={selectedPost.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 break-all text-sm font-semibold text-orange-600 hover:underline dark:text-orange-400"
                  >
                    {selectedPost.liveUrl} <ExternalLink size={14} />
                  </a>
                </div>
              )}

              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-900/60 sm:grid-cols-2">
                <p>
                  <span className="text-slate-400">Author:</span>{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedPost.author}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Votes:</span>{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedPost.votes}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Created:</span>{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {new Date(selectedPost.createdAt).toLocaleString()}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Expires:</span>{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedPost.expiresAt
                      ? new Date(selectedPost.expiresAt).toLocaleString()
                      : "—"}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                className={button}
                onClick={() => toggleResolved(selectedPost.id)}
              >
                {selectedPost.isResolved ? "Unresolve post" : "Resolve post"}
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900"
                onClick={() => setSelectedPost(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
