const { v4: uuidv4 } = require("uuid");
const { getProvider } = require("./providers/providerFactory");
const { AGENT_NAMES } = require("../config/agentDefinitions");
const projectModel = require("../models/project.model");
const taskModel = require("../models/task.model");
const agentService = require("./agent.service");
const integratorService = require("./integrator.service");
const { topoLayers } = require("../utils/topoSort");
const { ProviderError, ValidationError } = require("../utils/errors");
const logger = require("../utils/logger");
const env = require("../config/env");
const workspaceService = require("./workspace.service");
const agentPreferenceModel = require("../models/agentPreference.model");

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Orchestrator inside Loom, a multi-agent coding platform.
Given a project spec, break it into a task graph. Each task is owned by
exactly one of these agents: ${AGENT_NAMES.join(", ")}.

Rules:
- Prefer 3-6 tasks. One task per agent is typical; only split an agent's
  work into multiple tasks if the spec genuinely requires it.
- "dependsOn" references OTHER task ids in the SAME response (use your
  own short ids like "t1", "t2" — they get remapped after parsing).
  Database and Backend usually have no dependencies; Frontend usually
  depends on Backend; Testing usually depends on Backend and Frontend;
  Reviewer depends on everything.
- Every task description must be a complete, self-contained instruction
  — the agent executing it will NOT see the original spec, only this
  description.

Respond with ONLY a JSON object, no prose outside it, no markdown fences:
{
  "tasks": [
    { "id": "t1", "agent": "database", "description": "...", "dependsOn": [] },
    { "id": "t2", "agent": "backend", "description": "...", "dependsOn": ["t1"] }
  ]
}`;

function parseTaskGraph(rawText) {
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ProviderError("Orchestrator did not return valid JSON");
  }
  if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0 || parsed.tasks.length > 12) {
    throw new ProviderError("Orchestrator returned no tasks");
  }
  const ids = new Set();
  for (const t of parsed.tasks) {
    if (!t || typeof t.id !== "string" || !t.id.trim() || ids.has(t.id) || !AGENT_NAMES.includes(t.agent)
      || typeof t.description !== "string" || t.description.trim().length < 10
      || (t.dependsOn !== undefined && (!Array.isArray(t.dependsOn) || t.dependsOn.some((d) => typeof d !== "string")))) {
      throw new ProviderError("Orchestrator returned an invalid task");
    }
    ids.add(t.id);
  }
  for (const t of parsed.tasks) {
    const deps = t.dependsOn || [];
    if (deps.includes(t.id) || deps.some((id) => !ids.has(id))) {
      throw new ProviderError("Orchestrator returned an invalid task dependency");
    }
  }
  try { topoLayers(parsed.tasks.map((t) => ({ id: t.id, depends_on: t.dependsOn || [] }))); }
  catch { throw new ProviderError("Orchestrator returned a cyclic task graph"); }
  return parsed.tasks;
}

async function createProject({ userId, name, spec, providerKind = "free" }) {
  // Planning quality matters more than cost here — always use the paid
  // (stronger reasoning) provider for decomposition, regardless of what
  // the person picks for individual agents later.
  const planningKey = providerKind === "free" ? await require("./credential.service").getGroqKey(userId) : "";
  const provider = getProvider(providerKind, planningKey ? { apiKey: planningKey } : {});
  const { text } = await provider.generate({
    systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
    userPrompt: `Project spec:\n${spec}`,
  });

  const rawTasks = parseTaskGraph(text);

  // Remap the model's local ids ("t1", "t2") to real UUIDs before storing.
  const idMap = new Map(rawTasks.map((t) => [t.id, uuidv4()]));
  const tasks = rawTasks.map((t, i) => ({
    id: idMap.get(t.id),
    agentName: t.agent,
    description: t.description,
    dependsOn: (t.dependsOn || []).map((d) => idMap.get(d)).filter(Boolean),
    sequenceOrder: i,
  }));

  const projectId = uuidv4();
  const project = await projectModel.create({ id: projectId, userId, name, spec });
  await taskModel.bulkCreate(tasks.map((t) => ({ ...t, projectId })));

  logger.info("project_planned", { projectId, taskCount: tasks.length });

  return { project, tasks: await taskModel.listByProject(projectId) };
}

async function runProject({ projectId, userId, providerKind = "free", providerOverrides = {}, io }) {
  const project = await projectModel.findByIdForUser(projectId, userId);
  if (!project) throw new ValidationError("Project not found");

  await projectModel.claimRun(projectId, userId);
  emit(io, projectId, "project_started", { projectId });

  let tasks = await taskModel.listByProject(projectId);
  const savedPreferences = await agentPreferenceModel.listByUser(userId);
  const providers = Object.fromEntries(savedPreferences.map(({ agent_name, provider }) => [agent_name, provider]));
  Object.assign(providers, providerOverrides);
  const layers = topoLayers(tasks);
  const outputsById = new Map(); // taskId -> { explanation, files }
  const claimedPaths = new Map();

  for (const layer of layers) {
    // Tasks in the same layer have no dependency on each other — run them
    // concurrently to cut wall-clock time.
    await Promise.all(
      layer.map(async (taskId) => {
        const task = tasks.find((t) => t.id === taskId);
        const failedDependency = task.depends_on.some((depId) => !outputsById.has(depId));
        if (failedDependency) {
          await taskModel.updateStatus(task.id, "error");
          emit(io, projectId, "task_failed", { taskId: task.id, agent: task.agent_name, error: "A required dependency failed" });
          return;
        }
        await taskModel.updateStatus(task.id, "running");
        emit(io, projectId, "task_started", { taskId: task.id, agent: task.agent_name });

        // Build a contract from the outputs of this task's dependencies so,
        // e.g., Frontend sees the exact fields Backend actually produced.
        const contract = {};
        for (const depId of task.depends_on) {
          const depOutput = outputsById.get(depId);
          if (depOutput) contract[depId] = depOutput.files;
        }

        try {
          const result = await agentService.generate({
            userId,
            agentName: task.agent_name,
            taskDescription: task.description,
            contract,
            providerKind: providers[task.agent_name] || providerKind,
            taskId: task.id,
          });
          for (const file of result.files || []) {
            if (claimedPaths.has(file.path)) {
              throw new ValidationError(`Generated file collision: ${file.path} was already produced by ${claimedPaths.get(file.path)}`);
            }
          }
          for (const file of result.files || []) claimedPaths.set(file.path, task.agent_name);
          outputsById.set(task.id, result);
          await taskModel.updateStatus(task.id, "done", result.runId);
          emit(io, projectId, "task_completed", { taskId: task.id, agent: task.agent_name, runId: result.runId });
        } catch (err) {
          await taskModel.updateStatus(task.id, "error");
          emit(io, projectId, "task_failed", { taskId: task.id, agent: task.agent_name, error: err.message });
          // One failed task shouldn't necessarily block independent branches,
          // but it does block anything depending on it — topoLayers already
          // enforces that ordering, so downstream layers just proceed with
          // whatever contract data is available, and Reviewer flags the gap.
        }
      })
    );
  }

  let report = await integratorService.integrate({ projectId, userId, providerKind, outputsById });
  let reviewAttempts = 1;
  while (!report.approved && reviewAttempts < Math.max(1, env.reviewMaxAttempts)) {
    const corrections = await Promise.all((report.conflicts || []).map(async (conflict, index) => {
      try {
        const targetAgent = (conflict.agent && AGENT_NAMES.includes(conflict.agent)) ? conflict.agent : "coding";
        return await agentService.generate({
          userId,
          agentName: targetAgent,
          providerKind,
          taskDescription: `Fix this integration issue: ${conflict.description || conflict.suggestedFix || "Resolve the reviewer conflict"}`,
          contract: { files: integratorService.collectFiles(outputsById), conflict },
        });
      } catch (err) {
        logger.warn("integration_correction_failed", { projectId, index, error: err.message });
        return null;
      }
    }));
    corrections.filter(Boolean).forEach((result, index) => outputsById.set(`correction-${reviewAttempts}-${index}`, result));
    reviewAttempts += 1;
    report = await integratorService.integrate({ projectId, userId, providerKind, outputsById });
  }
  const workspace = await workspaceService.writeFiles(projectId, integratorService.collectFiles(outputsById));
  report = { ...report, reviewAttempts, workspace: workspace.workspace, filesWritten: workspace.written };
  await projectModel.setIntegrationReport(projectId, report);
  emit(io, projectId, "integration_complete", { projectId, approved: report.approved });

  return { project: await projectModel.findById(projectId), report };
}

function emit(io, projectId, event, payload) {
  if (io) io.to(`project:${projectId}`).emit(event, payload);
}

async function getProject(id, userId) {
  const project = await projectModel.findByIdForUser(id, userId);
  if (!project) return null;
  const tasks = await taskModel.listByProject(id);
  return { project, tasks };
}

module.exports = { createProject, runProject, getProject };
