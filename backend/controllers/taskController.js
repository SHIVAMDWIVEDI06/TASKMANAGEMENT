import mongoose from "mongoose";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { projectVisibleToUser } from "./projectController.js";

async function assertAdminOwnsProject(user, projectId) {
  const p = await Project.findById(projectId);
  if (!p || p.createdBy.toString() !== user._id.toString()) {
    return null;
  }
  return p;
}

export async function createTask(req, res, next) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can create tasks" });
    }
    const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }
    if (!dueDate) {
      return res.status(400).json({ message: "Due date is required" });
    }
    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ message: "Valid projectId is required" });
    }
    if (!assignedTo || !mongoose.isValidObjectId(assignedTo)) {
      return res.status(400).json({ message: "assignedTo user id is required" });
    }
    const project = await assertAdminOwnsProject(req.user, projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const assigneeInProject = project.members.some((m) => {
      const mid = m.user ? m.user.toString() : m.toString();
      return mid === String(assignedTo);
    });
    if (!assigneeInProject) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }
    const task = await Task.create({
      title: String(title).trim(),
      description: description != null ? String(description) : "",
      projectId,
      assignedTo,
      createdBy: req.user._id,
      status: status && ["Pending", "In Progress", "Completed"].includes(status) ? status : "Pending",
      priority:
        priority && ["Low", "Medium", "High"].includes(priority) ? priority : "Medium",
      dueDate: new Date(dueDate),
    });
    await task.populate("projectId assignedTo createdBy", "name email role projectName");
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

export async function listTasks(req, res, next) {
  try {
    const { projectId, assignedTo, status } = req.query;
    const filter = {};
    if (projectId && mongoose.isValidObjectId(projectId)) {
      const p = await projectVisibleToUser(projectId, req.user);
      if (!p) {
        return res.status(403).json({ message: "Access denied to this project" });
      }
      filter.projectId = projectId;
    }
    if (req.user.role === "member") {
      filter.assignedTo = req.user._id;
    } else {
      const adminProjects = await Project.find({ createdBy: req.user._id }).select("_id");
      const ids = adminProjects.map((x) => x._id);
      if (!filter.projectId) {
        filter.projectId = { $in: ids };
      } else if (!ids.some((id) => id.toString() === filter.projectId.toString())) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (assignedTo && mongoose.isValidObjectId(assignedTo)) {
        filter.assignedTo = assignedTo;
      }
    }
    if (status && ["Pending", "In Progress", "Completed"].includes(status)) {
      filter.status = status;
    }
    const tasks = await Task.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .populate("projectId", "projectName")
      .populate("assignedTo createdBy", "name email role");
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    const task = await Task.findById(id)
      .populate({
        path: "projectId",
        select: "projectName members createdBy",
        populate: {
          path: "members.user",
          select: "name email",
        },
      })
      .populate("assignedTo createdBy", "name email role");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const proj = task.projectId;
    const isAdminOwner =
      req.user.role === "admin" && proj.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo._id.toString() === req.user._id.toString();
    if (!isAdminOwner && !isAssignee) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    const task = await Task.findById(id).populate("projectId");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const project = await Project.findById(task.projectId._id || task.projectId);
    const isAdminOwner =
      req.user.role === "admin" && project.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();

    if (req.user.role === "admin" && isAdminOwner) {
      const { title, description, assignedTo, status, priority, dueDate } = req.body;
      if (title !== undefined) {
        if (!String(title).trim()) {
          return res.status(400).json({ message: "Title cannot be empty" });
        }
        task.title = String(title).trim();
      }
      if (description !== undefined) task.description = String(description);
      if (status !== undefined) {
        if (!["Pending", "In Progress", "Completed"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        task.status = status;
      }
      if (priority !== undefined) {
        if (!["Low", "Medium", "High"].includes(priority)) {
          return res.status(400).json({ message: "Invalid priority" });
        }
        task.priority = priority;
      }
      if (dueDate !== undefined) {
        if (!dueDate) {
          return res.status(400).json({ message: "Due date is required" });
        }
        task.dueDate = new Date(dueDate);
      }
      if (assignedTo !== undefined) {
        if (!mongoose.isValidObjectId(assignedTo)) {
          return res.status(400).json({ message: "Invalid assignee" });
        }
        const inProject = project.members.some((m) => {
          const mid = m.user ? m.user.toString() : m.toString();
          return mid === String(assignedTo);
        });
        if (!inProject) {
          return res.status(400).json({ message: "Assignee must be a project member" });
        }
        task.assignedTo = assignedTo;
      }
      await task.save();
      await task.populate({
        path: "projectId",
        select: "projectName members createdBy",
        populate: {
          path: "members.user",
          select: "name email",
        },
      });
      await task.populate("assignedTo createdBy", "name email role");
      return res.json({ task });
    }

    if (req.user.role === "member" && isAssignee) {
      const allowed = ["status"];
      const keys = Object.keys(req.body || {});
      const bad = keys.filter((k) => !allowed.includes(k));
      if (bad.length) {
        return res.status(403).json({ message: "Members may only update task status" });
      }
      const { status } = req.body;
      if (status === undefined) {
        return res.status(400).json({ message: "status is required" });
      }
      if (!["Pending", "In Progress", "Completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      task.status = status;
      await task.save();
      await task.populate({
        path: "projectId",
        select: "projectName members createdBy",
        populate: {
          path: "members.user",
          select: "name email",
        },
      });
      await task.populate("assignedTo createdBy", "name email role");
      return res.json({ task });
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete tasks" });
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const project = await Project.findById(task.projectId);
    if (!project || project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
}