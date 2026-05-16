import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDocUrl, setEditDocUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          api.get(`/api/projects/${id}`),
          api.get(`/api/tasks`, { params: { projectId: id } }),
        ]);
        if (!cancelled) {
          setProject(pRes.data.project);
          setEditName(pRes.data.project.projectName);
          setEditDesc(pRes.data.project.description || "");
          setEditDocUrl(pRes.data.project.documentUrl || "");
          setTasks(tRes.data.tasks || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || "Failed to load project");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function saveProject(e) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/api/projects/${id}`, {
        projectName: editName.trim(),
        description: editDesc,
        documentUrl: editDocUrl.trim(),
      });
      setProject(data.project);
    } catch (e) {
      setError(e.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleManageMember(userId, action, role) {
    if (!isAdmin && action !== "none") return;
    try {
      const { data } = await api.post(`/api/projects/${id}/members`, {
        userId,
        action,
        projectRole: role,
      });
      setProject(data.project);
    } catch (e) {
      setError(e.response?.data?.message || "Action failed");
    }
  }

  async function deleteProject() {
    if (!isAdmin) return;
    try {
      await api.delete(`/api/projects/${id}`);
      navigate("/dashboard");
    } catch (e) {
      setError(e.response?.data?.message || "Delete failed");
    }
  }

  if (error && !project) {
    return <p className="text-red-600 p-8">{error}</p>;
  }
  if (!project) {
    return <p className="text-slate-600 p-8">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.projectName}</h1>
          <p className="mt-1 text-slate-600">{project.description || "No description"}</p>
          {project.documentUrl && (
            <p className="mt-2">
              <a
                href={project.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                📄 View Project Document (Shared Drive)
              </a>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <Link
                to={`/projects/${id}/team`}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Add Member
              </Link>
              <Link
                to={`/projects/${id}/tasks/new`}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                New task
              </Link>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Tasks in this project</h2>
            {tasks.length === 0 ? (
              <p className="mt-4 text-slate-600 text-sm">No tasks yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {tasks.map((t) => {
                  const tid = t._id || t.id;
                  return (
                    <li key={tid} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <Link to={`/tasks/${tid}`} className="font-medium text-indigo-700 hover:underline text-sm">
                        {t.title}
                      </Link>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {t.status} · {t.priority}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {isAdmin && (
            <form
              onSubmit={saveProject}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
            >
              <h2 className="text-lg font-semibold text-slate-900">Project settings</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Project Document URL</label>
                <input
                  type="url"
                  value={editDocUrl}
                  onChange={(e) => setEditDocUrl(e.target.value)}
                  placeholder="https://"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  Save changes
                </button>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete project
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 font-medium">Sure?</span>
                    <button
                      type="button"
                      onClick={deleteProject}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Team members</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {(project.members || []).map((m) => {
                const u = m.user || {};
                const uid = u._id || u.id;
                return (
                  <li key={uid} className="py-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      {isAdmin && project.createdBy._id !== uid && (
                        <button
                          onClick={() => handleManageMember(uid, "remove")}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                        m.projectRole === "PL" ? "bg-purple-100 text-purple-700" :
                        m.projectRole === "QR" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {m.projectRole || "Tasker"}
                      </span>
                      {isAdmin && (
                        <select
                          value={m.projectRole || "Tasker"}
                          onChange={(e) => handleManageMember(uid, "updateRole", e.target.value)}
                          className="text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5"
                        >
                          <option value="Tasker">Tasker</option>
                          <option value="PL">PL</option>
                          <option value="QR">QR</option>
                        </select>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
