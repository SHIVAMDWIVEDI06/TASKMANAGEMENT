import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function TaskList() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilter = searchParams.get("projectId") || "";
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const reqs = [api.get("/api/tasks", { params: { projectId: projectFilter || undefined } })];
        if (isAdmin) reqs.push(api.get("/api/projects"));
        const results = await Promise.all(reqs);
        if (!cancelled) {
          setTasks(results[0].data.tasks || []);
          if (isAdmin && results[1]) setProjects(results[1].data.projects || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || "Failed to load tasks");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectFilter, isAdmin]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{isAdmin ? "All tasks" : "My tasks"}</h1>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      {isAdmin && projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Filter by project:</label>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={projectFilter}
            onChange={(e) => {
              const v = e.target.value;
              if (v) setSearchParams({ projectId: v });
              else setSearchParams({});
            }}
          >
            <option value="">All my projects</option>
            {projects.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.projectName}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Title</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Project</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Assignee</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((t) => {
              const tid = t._id || t.id;
              const pid = t.projectId?._id || t.projectId?.id || t.projectId;
              const pname = t.projectId?.projectName || "—";
              const assignee = t.assignedTo?.name || "—";
              return (
                <tr key={tid} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link to={`/tasks/${tid}`} className="font-medium text-indigo-700 hover:underline">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {pid ? (
                      <Link to={`/projects/${pid}`} className="hover:underline">
                        {pname}
                      </Link>
                    ) : (
                      pname
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{assignee}</td>
                  <td className="px-4 py-3 text-slate-600">{t.status}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.dueDate ? new Date(t.dueDate).toLocaleString() : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-600">No tasks found.</p>
        )}
      </div>
    </div>
  );
}
