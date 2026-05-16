import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Taskers() {
  const [taskers, setTaskers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        api.get("/api/dashboard/taskers"),
        api.get("/api/projects"),
      ]);
      setTaskers(tRes.data.taskers || []);
      setProjects(pRes.data.projects || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load taskers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAssign(userId, projectId) {
    if (!projectId) return;
    setAssigning(true);
    setError("");
    try {
      await api.post(`/api/projects/${projectId}/members`, {
        userId,
        action: "add",
      });
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to assign project");
    } finally {
      setAssigning(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    setError("");
    try {
      await api.put(`/api/dashboard/users/${userId}/role`, { role: newRole });
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update role");
    }
  }

  async function handleDeleteUser(userId, userName) {
    if (!window.confirm(`CRITICAL ACTION: Are you sure you want to REMOVE "${userName}" from the entire system? This will unassign them from all tasks and projects.`)) return;
    setError("");
    try {
      await api.delete(`/api/dashboard/users/${userId}`);
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete user");
    }
  }

  const filteredTaskers = taskers.filter((row) => {
    const s = searchQuery.toLowerCase();
    const name = (row.user.name || "").toLowerCase();
    const email = (row.user.email || "").toLowerCase();
    return name.includes(s) || email.includes(s);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Loading taskers…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Current taskers</h1>
          <p className="mt-1 text-sm text-slate-600">
            All users in the system, and their assignments across your portfolio.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
            Search members
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {filteredTaskers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">
            {searchQuery ? "No members match your search." : "No other users found in the system."}
          </p>
        </div>
      ) : (
        <ul className="space-y-6">
          {filteredTaskers.map((row) => (
            <li
              key={row.user.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{row.user.name}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      row.user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {row.user.role}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{row.user.email}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-md bg-emerald-100 px-2 py-1 font-medium text-emerald-900">
                    Done: {row.tasksCompleted}
                  </span>
                  <span className="rounded-md bg-amber-100 px-2 py-1 font-medium text-amber-900">
                    Pending: {row.tasksPending}
                  </span>
                  <span className="rounded-md bg-indigo-100 px-2 py-1 font-medium text-indigo-900">
                    In progress: {row.tasksInProgress}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current projects
                  </p>
                  {row.currentProjects.length === 0 ? (
                    <p className="mt-1 text-sm text-slate-600">None (not on a member list)</p>
                  ) : (
                    <ul className="mt-1 list-inside list-disc text-sm text-indigo-700">
                      {row.currentProjects.map((cp) => (
                        <li key={cp.id}>
                          <Link to={`/projects/${cp.id}`} className="hover:underline">
                            {cp.projectName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assign to Project
                  </label>
                  <div className="mt-1 flex gap-2">
                    <select
                      id={`assign-select-${row.user.id}`}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                      defaultValue=""
                    >
                      <option value="" disabled>Select project...</option>
                      {projects.map(p => {
                        const pid = (p._id || p.id || p).toString();
                        const isAlreadyMember = row.currentProjects.some(cp => (cp.id || cp._id || cp).toString() === pid);
                        if (isAlreadyMember) return null;
                        return (
                          <option key={pid} value={pid}>{p.projectName}</option>
                        );
                      })}
                    </select>
                    <button
                      disabled={assigning}
                      onClick={() => {
                        const sel = document.getElementById(`assign-select-${row.user.id}`);
                        if (sel && sel.value) handleAssign(row.user.id, sel.value);
                      }}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      System Role
                    </label>
                    <div className="mt-1">
                      <select
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                        value={row.user.role}
                        onChange={(e) => handleRoleChange(row.user.id, e.target.value)}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteUser(row.user.id, row.user.name)}
                    className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    Remove from System
                  </button>
                </div>

              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
