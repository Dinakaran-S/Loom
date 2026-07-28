const { z } = require("zod");
const { AGENT_NAMES } = require("../config/agentDefinitions");

const agentNameParamSchema = z.object({
  agentName: z.enum(AGENT_NAMES),
});

const generateSchema = z.object({
  taskDescription: z.string().min(10, "Describe the task in more detail").max(4000),
  contract: z.record(z.any()).optional(),
  provider: z.enum(["free", "paid"]).default("free"),
});

const listRunsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const runIdParamSchema = z.object({
  id: z.string().uuid("Invalid run id"),
});

const agentPreferenceSchema = z.object({
  provider: z.enum(["free", "paid"]),
});

module.exports = {
  agentNameParamSchema,
  generateSchema,
  listRunsQuerySchema,
  runIdParamSchema,
  agentPreferenceSchema,
};
