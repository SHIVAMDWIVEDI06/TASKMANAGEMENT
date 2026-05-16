import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function StatCard({ label, value, tone }) {
  const tones = {
    slate: "border-slate-200 bg-white",
    green: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
    indigo: "border-indigo-200 bg-indigo-50",
  };
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

const emptyAssignForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "Medium",
  status: "Pending",
  assignedTo: "",
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  const [assignProjectId, setAssignProjectId] = useState("");
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const reqs = [
          api.get("/api/dashboard/summary"),
          api.get("/api/projects"),
        ];
        if (isAdmin) reqs.push(api.get("/api/dashboard/taskers"));
        const results = await Promise.allSettled(reqs);
        if (cancelled) return;
        if (results[0].status === "fulfilled") {
          setSummary(results[0].value.data.summary);
        }
        if (results[1].status === "fulfilled") {
          setProjects(results[1].value.data.projects || []);
        }
        if (results.every((r) => r.status === "rejected")) {
          setError("Failed to load dashboard data");
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const assignMembers = (() => {
    if (!assignProjectId) return [];
    const p = projects.find((x) => (x._id || x.id) === assignProjectId);
    const members = p?.members || [];
    if (!memberSearch.trim()) return members;
    return members.filter((m) => {
      const u = m.user || {};
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const s = memberSearch.toLowerCase();
      return name.includes(s) || email.includes(s);
    });
  })();

  useEffect(() => {
    if (!assignProjectId) {
      setAssignForm((f) => ({ ...f, assignedTo: "" }));
      return;
    }
    const p = projects.find((x) => (x._id || x.id) === assignProjectId);
    const members = p?.members || [];
    if (!members.length) {
      setAssignForm((f) => ({ ...f, assignedTo: "" }));
      return;
    }
    const first = members[0]?.user?._id || members[0]?.user?.id || (typeof members[0] === "string" ? members[0] : "");
    setAssignForm((f) => {
      const stillValid = members.some((m) => {
        const uid = m.user?._id || m.user?.id || (typeof m === "string" ? m : "");
        return uid === f.assignedTo;
      });
      return { ...f, assignedTo: stillValid ? f.assignedTo : (first || f.assignedTo) };
    });
  }, [assignProjectId, projects]);

  async function handleAssignSubmit(e) {
    e.preventDefault();
    setAssignError("");
    setAssignSuccess("");
    if (!assignProjectId) {
      setAssignError("Choose a project first.");
      return;
    }
    if (!assignForm.title.trim()) {
      setAssignError("Task title is required.");
      return;
    }
    if (!assignForm.dueDate) {
      setAssignError("Due date is required.");
      return;
    }
    if (!assignForm.assignedTo) {
      setAssignError("Choose who to assign the task to.");
      return;
    }
    setAssignSubmitting(true);
    try {
      await api.post("/api/tasks", {
        title: assignForm.title.trim(),
        description: assignForm.description,
        projectId: assignProjectId,
        assignedTo: assignForm.assignedTo,
        priority: assignForm.priority,
        status: assignForm.status,
        dueDate: new Date(assignForm.dueDate).toISOString(),
      });
      setAssignSuccess("Task created.");
      setAssignForm({ ...emptyAssignForm, assignedTo: assignForm.assignedTo });
      try {
        const dash = await api.get("/api/dashboard/summary");
        setSummary(dash.data.summary);
      } catch {}
    } catch (err) {
      setAssignError(err.response?.data?.message || "Could not create task");
    } finally {
      setAssignSubmitting(false);
    }
  }

  async function handleUpdateProject(projectId, updates) {
    try {
      const { data } = await api.put(`/api/projects/${projectId}`, updates);
      setProjects((prev) =>
        prev.map((p) => ((p._id || p.id) === projectId ? data.project : p))
      );
    } catch (err) {
      setError("Failed to update project.");
    }
  }

  const selectedProject = projects.find((p) => (p._id || p.id) === assignProjectId);
  const assignMembers = selectedProject?.members || [];

  const s = summary || {};
  const maxBar = Math.max(s.totalTasks || 0, 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-slate-600">
          {isAdmin ? "Manage projects, members, and tasks from here." : "Track your assigned work."}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total tasks" value={s.totalTasks} tone="slate" />
            <StatCard label="Completed" value={s.completedTasks} tone="green" />
            <StatCard label="Pending" value={s.pendingTasks} tone="amber" />
            <StatCard label="In progress" value={s.inProgressTasks} tone="indigo" />
            <StatCard label="Overdue" value={s.overdueTasks} tone="red" />
          </div>
          {s.overdueTaskList?.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-red-900">Overdue tasks</h2>
              <p className="mt-1 text-sm text-red-700">{s.overdueTasks} tasks past due date</p>
              <ul className="mt-3 space-y-2">
                {s.overdueTaskList.map((t) => (
                  <li key={t._id || t.id}>
                    <Link
                      to={`/tasks/${t._id || t.id}`}
                      className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm shadow-sm hover:underline"
                    >
                      <span className="font-medium text-slate-900">{t.title}</span>
                      <span className="text-slate-600">
                        {t.assignedTo?.name} &middot; {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Task mix</h2>
            <p className="text-sm text-slate-500">Relative counts (not to scale if total is 0)</p>
            <div className="mt-4 space-y-3">
              {[
                ["Completed", s.completedTasks, "bg-emerald-500"],
                ["Pending", s.pendingTasks, "bg-amber-500"],
                ["In progress", s.inProgressTasks, "bg-indigo-500"],
                ["Overdue", s.overdueTasks, "bg-red-500"],
              ].map(([label, val, color]) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-900">{val}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${Math.min(100, ((val || 0) / maxBar) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {isAdmin && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Assign task</h2>
            <p className="mt-1 text-sm text-slate-600">
              Pick a project, then add a new task and choose who it is assigned to (must be a project member).
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="assign-project" className="block text-sm font-medium text-slate-700">
                  Project
                </label>
                <select
                  id="assign-project"
                  value={assignProjectId}
                  onChange={(e) => {
                    setAssignProjectId(e.target.value);
                    setAssignSuccess("");
                    setAssignError("");
                  }}
                  className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a project…</option>
                  {projects.map((p) => {
                    const pid = p._id || p.id;
                    return (
                      <option key={pid} value={pid}>
                        {p.projectName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {assignProjectId && (
                <form onSubmit={handleAssignSubmit} className="max-w-xl space-y-4 border-t border-slate-100 pt-4">
                  {assignError && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{assignError}</div>
                  )}
                  {assignSuccess && (
                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{assignSuccess}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Task title *</label>
                    <input
                      required
                      value={assignForm.title}
                      onChange={(e) => setAssignForm((f) => ({ ...f, title: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      rows={3}
                      value={assignForm.description}
                      onChange={(e) => setAssignForm((f) => ({ ...f, description: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Assign to *</label>
                      <input
                        type="text"
                        placeholder="Search team members..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1 text-xs"
                      />
                      <select
                        required
                        value={assignForm.assignedTo}
                        onChange={(e) => setAssignForm((f) => ({ ...f, assignedTo: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      >
                        <option value="">-- Select member --</option>
                        {assignMembers.map((m) => {
                          const u = m.user || {};
                          const uid = u._id || u.id || (typeof m === "string" ? m : "");
                          if (!uid) return null;
                          return (
                            <option key={uid} value={uid}>
                              {u.name || "Unknown"} ({u.email || "No email"}) — {m.projectRole || "Tasker"}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Due date *</label>
                      <input
                        type="datetime-local"
                        required
                        value={assignForm.dueDate}
                        onChange={(e) => setAssignForm((f) => ({ ...f, dueDate: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Priority</label>
                      <select
                        value={assignForm.priority}
                        onChange={(e) => setAssignForm((f) => ({ ...f, priority: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Initial status</label>
                      <select
                        value={assignForm.status}
                        onChange={(e) => setAssignForm((f) => ({ ...f, status: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={assignSubmitting}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {assignSubmitting ? "Creating…" : "Create & assign task"}
                    </button>
                    <Link
                      to={`/projects/${assignProjectId}`}
                      className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Open project
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </section>

        </>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
          {isAdmin && (
            <Link
              to="/projects/create"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              New project
            </Link>
          )}
        </div>
        {projects.length === 0 ? (
          <p className="mt-4 text-slate-600">
            {isAdmin ? "Create your first project to get started." : "No projects yet. Ask an admin to add you."}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {projects.map((p) => (
              <li key={p._id || p.id} className="flex flex-col gap-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/projects/${p._id || p.id}`} className="font-medium text-indigo-700 hover:underline flex items-center gap-2">
                    {p.projectName}
                    {p.status === "Completed" && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Completed
                      </span>
                    )}
                  </Link>
                  <span className="text-sm text-slate-500">
                    {(p.members && p.members.length) || 0} members
                  </span>
                </div>
                {p.comment && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="font-medium text-slate-700 text-xs uppercase mr-2">Note:</span>
                    {p.comment}
                  </p>
                )}
                {isAdmin && (
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => handleUpdateProject(p._id || p.id, { status: p.status === "Completed" ? "Active" : "Completed" })}
                      className="text-xs px-2 py-1 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200"
                    >
                      Mark as {p.status === "Completed" ? "Active" : "Completed"}
                    </button>
                    <button
                      onClick={() => {
                        const newComment = prompt("Add comment for project:", p.comment || "");
                        if (newComment !== null) {
                          handleUpdateProject(p._id || p.id, { comment: newComment });
                        }
                      }}
                      className="text-xs px-2 py-1 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200"
                    >
                      {p.comment ? "Edit Comment" : "Add Comment"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
