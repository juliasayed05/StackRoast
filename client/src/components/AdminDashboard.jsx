import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Flame,
  MessageSquare,
  RefreshCw,
  Shield,
  Trash2,
  Users,
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
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summary, userResult, postResult] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users"),
        api.get("/admin/posts"),
      ]);
      setData(summary);
      setUsers(userResult.users || []);
      setPosts(postResult.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

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

      await load();
    } catch (err) {
      onToast(err.message || "Failed to delete user.", "error");
    } finally {
      setDeletingUserId(null);
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
              <h2 className="mb-4 text-sm font-extrabold text-slate-900 dark:text-white">
                All posts ({posts.length})
              </h2>
              <div className="space-y-3">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {post.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {post.description}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-400">
                          {post.author} · {post.votes} votes ·{" "}
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                        <button
                          className={`${button} min-h-10 flex-1 justify-center sm:flex-none`}
                          onClick={() => toggleResolved(post.id)}
                        >
                          {post.isResolved ? "Unresolve" : "Resolve"}
                        </button>
                        <button
                          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold sm:flex-none text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
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
                    No posts found.
                  </p>
                )}
              </div>
            </section>
          )}
          {tab === "users" && (
            <section className={card}>
              <h2 className="mb-4 text-sm font-extrabold text-slate-900 dark:text-white">
                Registered users ({users.length})
              </h2>
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
                    {u.role !== "admin" && (
                      <button
                        type="button"
                        disabled={deletingUserId === u.id}
                        onClick={() => removeUser(u.id, u.username)}
                        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 size={14} />
                        {deletingUserId === u.id
                          ? "Deleting..."
                          : "Delete User"}
                      </button>
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
                      <th className="pb-3">Joined</th>
                      <th className="pb-3">Action</th>
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
                        <td className="py-3 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          {u.role !== "admin" && (
                            <button
                              type="button"
                              disabled={deletingUserId === u.id}
                              onClick={() => removeUser(u.id, u.username)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 size={13} />
                              {deletingUserId === u.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
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
            </section>
          )}
        </>
      )}
    </main>
  );
}
