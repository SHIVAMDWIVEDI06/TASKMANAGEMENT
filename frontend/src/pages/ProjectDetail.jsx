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
    return <p className="text-red-600">{error}</p>;
  }
  if (!project) {
    return <p className="text-slate-600">Loading…</p>;
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
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                📄 View Project Document
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
                Manage team
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

      {isAdmin && (
        <form
          onSubmit={saveProject}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-900">Edit project</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Project Document URL</label>
            <input
              type="url"
              value={editDocUrl}
              onChange={(e) => setEditDocUrl(e.target.value)}
              placeholder="https://"
              className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="flex flex-wrap gap-2">
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

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tasks in this project</h2>
        {tasks.length === 0 ? (
          <p className="mt-4 text-slate-600">No tasks yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {tasks.map((t) => {
              const tid = t._id || t.id;
              return (
                <li key={tid} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <Link to={`/tasks/${tid}`} className="font-medium text-indigo-700 hover:underline">
                    {t.title}
                  </Link>
                  <span className="text-sm text-slate-600">
                    {t.status} · {t.priority}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
