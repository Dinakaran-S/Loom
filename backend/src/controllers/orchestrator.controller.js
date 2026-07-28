const orchestratorService = require("../services/orchestrator.service");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const { NotFoundError } = require("../utils/errors");
const workspaceService = require("../services/workspace.service");

const createProject = asyncHandler(async (req, res) => {
  const { name, spec, provider = "free" } = req.body;
  const result = await orchestratorService.createProject({ userId: req.user.id, name, spec, providerKind: provider });
  return success(res, result, "Task graph planned", 201);
});

const listProjects = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const result = await require("../models/project.model").listByUser(req.user.id, { page, limit });
  return success(res, result);
});

const runProject = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const result = await orchestratorService.runProject({
    projectId: req.params.id,
    userId: req.user.id,
    providerKind: req.body.provider,
    providerOverrides: req.body.providers,
    io,
  });
  return success(res, result, "Run complete");
});

const getProject = asyncHandler(async (req, res) => {
  const result = await orchestratorService.getProject(req.params.id, req.user.id);
  if (!result) throw new NotFoundError("Project not found");
  return success(res, result);
});

const getFiles = asyncHandler(async (req, res) => {
  const result = await orchestratorService.getProject(req.params.id, req.user.id);
  if (!result) throw new NotFoundError("Project not found");
  return success(res, { files: await workspaceService.listFiles(req.params.id) });
});

module.exports = { createProject, listProjects, runProject, getProject, getFiles };
