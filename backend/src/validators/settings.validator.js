const { z } = require("zod");

const groqApiKeySchema = z.object({
  apiKey: z.string().trim().min(20, "Enter a valid Groq API key").max(500),
});

module.exports = { groqApiKeySchema };
