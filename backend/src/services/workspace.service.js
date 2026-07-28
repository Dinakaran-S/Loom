const fs = require("fs/promises");
const path = require("path");
const env = require("../config/env");
const { ValidationError } = require("../utils/errors");

function rootPath() { return path.resolve(env.projectsRoot); }

function safeRelativePath(filePath) {
  if (typeof filePath !== "string" || !filePath.trim()) throw new ValidationError("Generated file needs a path");
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (path.isAbsolute(normalized) || normalized.split("/").includes("..")) throw new ValidationError("Generated file path must be relative to the project workspace");
  return normalized;
}

async function writeFiles(projectId, files) {
  const workspace = path.resolve(rootPath(), projectId);
  if (!workspace.startsWith(`${rootPath()}${path.sep}`)) throw new ValidationError("Invalid project workspace");
  const written = [];
  for (const file of files || []) {
    if (!file || typeof file.code !== "string") continue;
    const relativePath = safeRelativePath(file.path);
    const target = path.resolve(workspace, relativePath);
    if (!target.startsWith(`${workspace}${path.sep}`)) throw new ValidationError("Generated file escaped its workspace");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.code, "utf8");
    written.push(relativePath);
  }
  return { workspace, written };
}

async function listFiles(projectId) {
  const workspace = path.resolve(rootPath(), projectId);
  try {
    const result = [];
    async function visit(dir) {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await visit(full);
        else result.push(path.relative(workspace, full).replace(/\\/g, "/"));
      }
    }
    await visit(workspace);
    return result.sort();
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function readFile(projectId, requestedPath) {
  const workspace = path.resolve(rootPath(), projectId);
  const relativePath = safeRelativePath(requestedPath);
  const target = path.resolve(workspace, relativePath);
  if (!target.startsWith(`${workspace}${path.sep}`)) throw new ValidationError("Generated file escaped its workspace");
  try {
    const info = await fs.stat(target);
    if (!info.isFile()) throw new ValidationError("Requested workspace path is not a file");
    if (info.size > 500_000) throw new ValidationError("Requested file is too large to display");
    return { path: relativePath, content: await fs.readFile(target, "utf8"), size: info.size };
  } catch (err) {
    if (err.code === "ENOENT") throw new ValidationError("Generated file not found");
    throw err;
  }
}

module.exports = { writeFiles, listFiles, readFile };
