import mongoose from "mongoose";
import { sendAssignmentEmail } from "../utils/email.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

async function projectVisibleToUser(projectId, user) {
  const p = await Project.findById(projectId);
  if (!p) return null;
  if (user.role === "admin" && p.createdBy.toString() === user._id.toString()) return p;
  if (user.role === "member" && p.members.some((m) => m.toString() === user._id.toString())) {
    return p;
  }
  return null;
}

export async function createProject(req, res, next) {
  try {
    const { projectName, description, documentUrl } = req.body;
    if (!projectName || !String(projectName).trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }
    const project = await Project.create({
      projectName: String(projectName).trim(),
      description: description != null ? String(description) : "",
      documentUrl: documentUrl != null ? String(documentUrl).trim() : "",
      createdBy: req.user._id,
      members: [req.user._id],
    });
    await project.populate("createdBy members", "name email role");
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

export async function listProjects(req, res, next) {
  try {
    let query;
    if (req.user.role === "admin") {
      query = { createdBy: req.user._id };
    } else {
      query = { members: req.user._id };
    }
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy members", "name email role");
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    const project = await Project.findById(id).populate("createdBy members", "name email role");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const isAdminOwner = req.user.role === "admin" && project.createdBy._id.toString() === req.user._id.toString();
    const isMember = project.members.some((m) => m._id.toString() === req.user._id.toString());
    if (!isAdminOwner && !isMember) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { projectName, description, documentUrl, status, comment } = req.body;
    if (projectName !== undefined) {
      if (!String(projectName).trim()) {
        return res.status(400).json({ message: "Project name cannot be empty" });
      }
      project.projectName = String(projectName).trim();
    }
    if (description !== undefined) {
      project.description = String(description);
    }
    if (documentUrl !== undefined) {
      project.documentUrl = String(documentUrl).trim();
    }
    if (status !== undefined) {
      if (!["Active", "Completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      project.status = status;
    }
    if (comment !== undefined) {
      project.comment = String(comment);
    }
    await project.save();
    await project.populate("createdBy members", "name email role");
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    const Task = (await import("../models/Task.js")).default;
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();
    res.json({ message: "Project deleted" });
  } catch (err) {
    next(err);
  }
}

export async function manageMembers(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { userId, email, action } = req.body;
    let targetId = userId;
    if (!targetId && email) {
      const u = await User.findOne({ email: String(email).trim().toLowerCase() });
      if (!u) {
        return res.status(404).json({ message: "User not found for that email" });
      }
      targetId = u._id;
    }
    if (!targetId || !mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ message: "userId or email and action are required" });
    }
    if (action !== "add" && action !== "remove") {
      return res.status(400).json({ message: "action must be 'add' or 'remove'" });
    }
    const oid = new mongoose.Types.ObjectId(targetId);
    if (action === "add") {
      if (!project.members.some((m) => m.toString() === oid.toString())) {
        project.members.push(oid);
      }
    } else {
      if (oid.toString() === project.createdBy.toString()) {
        return res.status(400).json({ message: "Cannot remove project creator from members" });
      }
      project.members = project.members.filter((m) => m.toString() !== oid.toString());
    }
    await project.save();
    await project.populate("createdBy members", "name email role");

    const targetUser = await User.findById(targetId);
    if (targetUser) {
      sendAssignmentEmail(targetUser.email, targetUser.name, project.projectName, action);
    }

    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export { projectVisibleToUser };