const axios = require("axios");
const env = require("../../config/env");
const { ProviderError } = require("../../utils/errors");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

async function generate({ systemPrompt, userPrompt }) {
  if (!env.providers.anthropicApiKey) {
    throw new ProviderError("Anthropic API key not configured");
  }
  try {
    const { data } = await axios.post(
      ANTHROPIC_URL,
      {
        model: env.providers.anthropicModel,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
      {
        headers: {
          "x-api-key": env.providers.anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        timeout: 60_000,
      }
    );
    const text = (data.content || []).map((b) => b.text || "").join("\n");
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    return { text, tokensUsed, model: env.providers.anthropicModel };
  } catch (err) {
    throw new ProviderError(`Claude API request failed: ${err.response?.data?.error?.message || err.message}`);
  }
}

module.exports = { generate, name: "paid", label: "Claude Sonnet 5" };
