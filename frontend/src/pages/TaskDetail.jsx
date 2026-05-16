import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/api/tasks/${id}`);
        if (!cancelled) {
          setTask(data.task);
          const t = data.task;
          setForm({
            title: t.title,
            description: t.description || "",
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 16) : "",
            assignedTo: (t.assignedTo?._id || t.assignedTo?.id || t.assignedTo)?.toString?.() || t.assignedTo,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || "Failed to load task");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const assigneeId = task?.assignedTo?._id || task?.assignedTo?.id || task?.assignedTo;
  const uid = user?.id || user?._id;
  const isAssignee = user && assigneeId && assigneeId.toString() === uid?.toString();
  const projectMembers = task?.projectId?.members || [];

  async function saveAdmin(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put(`/api/tasks/${id}`, {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        dueDate: new Date(form.dueDate).toISOString(),
        assignedTo: form.assignedTo,
      });
      setTask(data.task);
    } catch (e) {
      setError(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask() {
    try {
      await api.delete(`/api/tasks/${id}`);
      navigate("/tasks");
    } catch (e) {
      setError(e.response?.data?.message || "Delete failed");
    }
  }

  if (error && !task) return <p className="text-red-600">{error}</p>;
  if (!task) return <p className="text-slate-600">Loading…</p>;

  const pid = task.projectId?._id || task.projectId?.id;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to={pid ? `/projects/${pid}` : "/tasks"} className="text-sm font-medium text-indigo-600 hover:underline">
        Back
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {!isAdmin && isAssignee && (
        <Link
          to={`/tasks/${id}/status`}
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Update status
        </Link>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-2 text-slate-700">
        <p>
          <span className="font-medium text-slate-900">Project:</span>{" "}
          {task.projectId?.projectName}
        </p>
        <p>
          <span className="font-medium text-slate-900">Assignee:</span>{" "}
          {task.assignedTo?.name} ({task.assignedTo?.email})
        </p>
        <p>
          <span className="font-medium text-slate-900">Status:</span> {task.status}
        </p>
        <p>
          <span className="font-medium text-slate-900">Priority:</span> {task.priority}
        </p>
        <p>
          <span className="font-medium text-slate-900">Due:</span>{" "}
          {task.dueDate ? new Date(task.dueDate).toLocaleString() : "—"}
        </p>
        <p className="pt-2 whitespace-pre-wrap">{task.description}</p>
      </div>

      {isAdmin && (
        <form onSubmit={saveAdmin} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Edit task</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Due</label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Assignee</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {projectMembers.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Save
            </button>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete task
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 font-medium">Sure?</span>
                <button
                  type="button"
                  onClick={deleteTask}
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
  );
}
