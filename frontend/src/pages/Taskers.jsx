import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Taskers() {
  const [taskers, setTaskers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Loading taskers…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Current taskers</h1>
        <p className="mt-1 text-sm text-slate-600">
          All users in the system, and their assignments across your portfolio.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {taskers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">No other users found in the system.</p>
        </div>
      ) : (
        <ul className="space-y-6">
          {taskers.map((row) => (
            <li
              key={row.user.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{row.user.name}</p>
                  <p className="text-sm text-slate-600">{row.user.email}</p>
                  <span className="mt-1 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {row.user.role}
                  </span>
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
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        const isAlreadyMember = row.currentProjects.some(cp => cp.id === p._id);
                        if (isAlreadyMember) return null;
                        return (
                          <option key={p._id} value={p._id}>{p.projectName}</option>
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

              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
