import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function TaskStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [status, setStatus] = useState("Pending");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/api/tasks/${id}`);
        if (!cancelled) {
          setTask(data.task);
          setStatus(data.task.status);
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put(`/api/tasks/${id}`, { status });
      navigate(`/tasks/${id}`);
    } catch (e) {
      setError(e.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (error && !task) return <p className="text-red-600">{error}</p>;
  if (!task) return <p className="text-slate-600">Loading…</p>;
  if (!isAssignee) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">You can only update status on tasks assigned to you.</p>
        <Link to={`/tasks/${id}`} className="text-indigo-600 hover:underline">
          Back to task
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link to={`/tasks/${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
        Back to task
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Update status</h1>
      <p className="text-slate-600">{task.title}</p>
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save status"}
        </button>
      </form>
    </div>
  );
}
