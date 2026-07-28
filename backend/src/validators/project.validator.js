const { z } = require("zod");

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  spec: z.string().min(10, "Describe the project in more detail").max(4000),
  provider: z.enum(["free", "paid"]).default("free"),
});

const runProjectSchema = z.object({
  provider: z.enum(["free", "paid"]).default("free"),
  providers: z.record(z.enum(["free", "paid"])).optional(),
});

const projectIdParamSchema = z.object({
  id: z.string().uuid("Invalid project id"),
});

const fileQuerySchema = z.object({
  path: z.string().min(1).max(240),
});

module.exports = { createProjectSchema, runProjectSchema, projectIdParamSchema, fileQuerySchema };
