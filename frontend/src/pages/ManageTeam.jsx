import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";

export default function ManageTeam() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [email, setEmail] = useState("");
  const [action, setAction] = useState("add");
  const [projectRole, setProjectRole] = useState("Tasker");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await api.get(`/api/projects/${projectId}`);
    setProject(data.project);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await api.post(`/api/projects/${projectId}/members`, {
        email: email.trim(),
        action,
        projectRole,
      });
      setEmail("");
      setMsg(action === "add" ? "Member added." : "Member removed.");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Request failed");
    }
  }

  if (loading) return <p className="text-slate-600">Loading…</p>;
  if (!project) return <p className="text-red-600">{error || "Not found"}</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to={`/projects/${projectId}`} className="text-sm font-medium text-indigo-600 hover:underline">
          Back to project
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Manage team — {project.projectName}</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        {msg && (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700">Member email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="add">Add member</option>
            <option value="remove">Remove member</option>
          </select>
        </div>
        {action === "add" && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Project Role</label>
            <select
              value={projectRole}
              onChange={(e) => setProjectRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="Tasker">Tasker</option>
              <option value="PL">PL</option>
              <option value="QR">QR</option>
            </select>
          </div>
        )}
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">
          Apply
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Current members</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {(project.members || []).map((m) => {
            const u = m.user || {};
            return (
              <li key={u._id || u.id} className="py-2 text-slate-800">
                {u.name} <span className="text-slate-500">({u.email})</span> —{" "}
                <span className="font-bold text-indigo-600">{m.projectRole || "Tasker"}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
