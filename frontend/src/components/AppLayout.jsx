import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/dashboard" className="text-lg font-semibold text-indigo-700">
            Team Task Manager
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            {isAdmin && (
              <>
                <NavLink to="/projects/create" className={linkClass}>
                  New project
                </NavLink>
                <NavLink to="/tasks" className={linkClass}>
                  All tasks
                </NavLink>
                <NavLink to="/taskers" className={linkClass}>
                  Taskers
                </NavLink>
              </>
            )}
            {!isAdmin && (
              <NavLink to="/tasks" className={linkClass}>
                My tasks
              </NavLink>
            )}
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.name} ({user?.role})
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
