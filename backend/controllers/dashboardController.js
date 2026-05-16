import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

export async function dashboardTaskers(req, res, next) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const projects = await Project.find({ createdBy: req.user._id })
      .select("projectName members")
      .populate("members.user", "name email role");

    const projectIds = projects.map((p) => p._id);
    const projectMeta = new Map(
      projects.map((p) => [p._id.toString(), { id: p._id.toString(), projectName: p.projectName }])
    );

    const tasks =
      projectIds.length === 0
        ? []
        : await Task.find({ projectId: { $in: projectIds } })
            .select("assignedTo projectId status")
            .populate("assignedTo", "name email role");

    // Fetch all users except the current admin
    const allUsers = await User.find({ _id: { $ne: req.user._id } });
    
    const byUser = new Map();

    function ensureRow(userDoc) {
      const uid = userDoc._id.toString();
      if (!byUser.has(uid)) {
        byUser.set(uid, {
          user: {
            id: uid,
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
          },
          tasksCompleted: 0,
          tasksPending: 0,
          tasksInProgress: 0,
          currentProjects: [],
          workedOnProjectIds: new Set(),
        });
      }
      return byUser.get(uid);
    }

    // Initialize all users in the map
    for (const u of allUsers) {
      ensureRow(u);
    }

    for (const p of projects) {
      for (const m of p.members || []) {
        if (!m.user) continue;
        const uid = m.user._id ? m.user._id.toString() : m.user.toString();
        if (byUser.has(uid)) {
          const row = byUser.get(uid);
          row.currentProjects.push({
            id: p._id.toString(),
            projectName: p.projectName,
          });
          row.workedOnProjectIds.add(p._id.toString());
        }
      }
    }

    for (const t of tasks) {
      const assignee = t.assignedTo;
      if (!assignee) continue;
      const uid = assignee._id.toString();
      if (byUser.has(uid)) {
        const row = byUser.get(uid);
        row.workedOnProjectIds.add(t.projectId.toString());
        if (t.status === "Completed") row.tasksCompleted += 1;
        else if (t.status === "Pending") row.tasksPending += 1;
        else if (t.status === "In Progress") row.tasksInProgress += 1;
      }
    }

    const adminId = req.user._id.toString();
    if (byUser.has(adminId)) {
      byUser.delete(adminId);
    }

    const taskers = [...byUser.values()].map((row) => {
      const workedOnProjects = [...row.workedOnProjectIds]
        .map((pid) => projectMeta.get(pid))
        .filter(Boolean)
        .sort((a, b) => a.projectName.localeCompare(b.projectName));
      return {
        user: row.user,
        tasksCompleted: row.tasksCompleted,
        tasksPending: row.tasksPending,
        tasksInProgress: row.tasksInProgress,
        currentProjects: row.currentProjects,
        workedOnProjects,
      };
    });

    taskers.sort((a, b) => a.user.name.localeCompare(b.user.name));

    res.json({ taskers });
  } catch (err) {
    next(err);
  }
}

export async function dashboardSummary(req, res, next) {
  try {
    const now = new Date();
    let taskFilter = {};

    if (req.user.role === "admin") {
      const projects = await Project.find({ createdBy: req.user._id }).select("_id");
      const ids = projects.map((p) => p._id);
      taskFilter = { projectId: { $in: ids } };
    } else {
      taskFilter = { assignedTo: req.user._id };
    }

    const [total, completed, pending, inProgress, overdueAgg, overdueTasks, totalProjects, completedProjects] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: "Completed" }),
      Task.countDocuments({ ...taskFilter, status: "Pending" }),
      Task.countDocuments({ ...taskFilter, status: "In Progress" }),
      Task.countDocuments({
        ...taskFilter,
        status: { $ne: "Completed" },
        dueDate: { $lt: now },
      }),
      Task.find({
        ...taskFilter,
        status: { $ne: "Completed" },
        dueDate: { $lt: now },
      })
        .sort({ dueDate: 1 })
        .limit(20)
        .populate("projectId", "projectName")
        .populate("assignedTo", "name email"),
      Project.countDocuments(req.user.role === "admin" ? { createdBy: req.user._id } : { "members.user": req.user._id }),
      Project.countDocuments(req.user.role === "admin" ? { createdBy: req.user._id, status: "Completed" } : { "members.user": req.user._id, status: "Completed" }),
    ]);

    res.json({
      summary: {
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        overdueTasks: overdueAgg,
        overdueTaskList: overdueTasks,
        totalProjects,
        completedProjects,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (role !== "admin" && role !== "member") {
      return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'member'." });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot change your own role." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}.`, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
}