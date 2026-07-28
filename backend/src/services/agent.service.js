const { v4: uuidv4 } = require("uuid");
const { getProvider } = require("./providers/providerFactory");
const { AGENTS, isValidAgent } = require("../config/agentDefinitions");
const agentRunModel = require("../models/agentRun.model");
const logger = require("../utils/logger");
const { ValidationError } = require("../utils/errors");

function buildUserPrompt(taskDescription, contract) {
  let prompt = `Task:\n${taskDescription}`;
  if (contract && Object.keys(contract).length) {
    prompt += `\n\nContract to respect exactly:\n${JSON.stringify(contract, null, 2)}`;
  }
  return prompt;
}

function parseModelOutput(rawText) {
  // Models sometimes wrap JSON in fences despite instructions — strip defensively.
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to raw text as a single unparsed "file" so a bad JSON
    // response doesn't lose the generated work entirely.
    return {
      explanation: "Model did not return valid JSON — showing raw output.",
      files: [{ path: "output.txt", code: rawText }],
    };
  }
}

async function generate({ userId, agentName, taskDescription, contract, providerKind, taskId }) {
  if (!isValidAgent(agentName)) {
    throw new ValidationError(`Unknown agent: ${agentName}`);
  }

  const provider = getProvider(providerKind);
  const runId = uuidv4();
  const systemPrompt = AGENTS[agentName].systemPrompt;

  try {
    const { text, tokensUsed, model } = await provider.generate({
      systemPrompt,
      userPrompt: buildUserPrompt(taskDescription, contract),
    });

    const parsed = parseModelOutput(text);

    await agentRunModel.create({
      id: runId,
      userId,
      agentName,
      provider: providerKind,
      model,
      taskDescription,
      status: "success",
      outputCode: JSON.stringify(parsed.files || parsed.conflicts || []),
      outputExplanation: parsed.explanation || "",
      tokensUsed,
      taskId,
    });

    logger.info("agent_run_success", { runId, agentName, providerKind, tokensUsed, taskId });

    return { runId, provider: providerKind, model, tokensUsed, ...parsed };
  } catch (err) {
    // Persist the failed attempt too — feeds the self-correction loop and
    // the cost/reliability dashboard.
    await agentRunModel.create({
      id: runId,
      userId,
      agentName,
      provider: providerKind,
      model: null,
      taskDescription,
      status: "error",
      errorMessage: err.message,
      taskId,
    });
    logger.error("agent_run_failed", { runId, agentName, providerKind, taskId, error: err.message });
    throw err;
  }
}

async function listRuns(userId, { page, limit }) {
  return agentRunModel.listByUser(userId, { page, limit });
}

async function getRun(id) {
  return agentRunModel.findById(id);
}

module.exports = { generate, listRuns, getRun };
