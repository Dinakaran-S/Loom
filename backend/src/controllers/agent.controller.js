const agentService = require("../services/agent.service");
const asyncHandler = require("../utils/asyncHandler");
const { success, paginated } = require("../utils/apiResponse");
const { NotFoundError, ForbiddenError } = require("../utils/errors");
const agentPreferenceModel = require("../models/agentPreference.model");

const generate = asyncHandler(async (req, res) => {
  const { taskDescription, contract, provider } = req.body;
  const result = await agentService.generate({
    userId: req.user.id,
    agentName: req.params.agentName,
    taskDescription,
    contract,
    providerKind: provider,
  });
  return success(res, result, "Generation complete", 201);
});

const listRuns = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { rows, total } = await agentService.listRuns(req.user.id, { page, limit });
  return paginated(res, rows, { page, limit, total });
});

const getRun = asyncHandler(async (req, res) => {
  const run = await agentService.getRun(req.params.id);
  if (!run) throw new NotFoundError("Run not found");
  if (run.user_id !== req.user.id) throw new ForbiddenError();
  return success(res, run);
});

const listPreferences = asyncHandler(async (req, res) => {
  const preferences = await agentPreferenceModel.listByUser(req.user.id);
  return success(res, { preferences });
});

const updatePreference = asyncHandler(async (req, res) => {
  const preference = await agentPreferenceModel.upsert({
    userId: req.user.id,
    agentName: req.params.agentName,
    provider: req.body.provider,
  });
  return success(res, { preference }, "Provider preference saved");
});

module.exports = { generate, listRuns, getRun, listPreferences, updatePreference };
