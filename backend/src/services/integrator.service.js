const projectModel = require("../models/project.model");
const agentService = require("./agent.service");
const logger = require("../utils/logger");

async function integrate({ projectId, userId, providerKind, outputsById }) {
  const allFiles = [];
  for (const [taskId, output] of outputsById.entries()) {
    for (const file of output.files || []) {
      allFiles.push({ taskId, path: file.path, code: file.code });
    }
  }

  if (allFiles.length === 0) {
    const report = { approved: false, explanation: "No agent produced usable output to review.", conflicts: [] };
    await projectModel.setIntegrationReport(projectId, report);
    return report;
  }

  const taskDescription = `Review these combined files from a single project for integration problems:\n\n${allFiles
    .map((f) => `--- ${f.path} ---\n${f.code}`)
    .join("\n\n")}`;

  try {
    const result = await agentService.generate({
      userId,
      agentName: "reviewer",
      taskDescription,
      providerKind,
    });

    const report = {
      approved: result.approved !== false,
      explanation: result.explanation || "",
      conflicts: result.conflicts || [],
    };
    await projectModel.setIntegrationReport(projectId, report);
    logger.info("integration_complete", { projectId, approved: report.approved, conflicts: report.conflicts.length });
    return report;
  } catch (err) {
    const report = { approved: false, explanation: `Review failed: ${err.message}`, conflicts: [] };
    await projectModel.setIntegrationReport(projectId, report);
    return report;
  }
}

function collectFiles(outputsById) {
  const files = [];
  for (const [taskId, output] of outputsById.entries()) {
    for (const file of output.files || []) files.push({ taskId, path: file.path, code: file.code });
  }
  return files;
}

module.exports = { integrate, collectFiles };
