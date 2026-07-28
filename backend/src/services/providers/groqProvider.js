const axios = require("axios");
const env = require("../../config/env");
const { ProviderError } = require("../../utils/errors");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function generate({ systemPrompt, userPrompt }) {
  if (!env.providers.groqApiKey) {
    throw new ProviderError("Groq API key not configured");
  }
  try {
    const { data } = await axios.post(
      GROQ_URL,
      {
        model: env.providers.groqModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${env.providers.groqApiKey}`,
          "content-type": "application/json",
        },
        timeout: 60_000,
      }
    );
    const text = data.choices?.[0]?.message?.content || "";
    const tokensUsed = data.usage?.total_tokens || 0;
    return { text, tokensUsed, model: env.providers.groqModel };
  } catch (err) {
    throw new ProviderError(`Groq API request failed: ${err.response?.data?.error?.message || err.message}`);
  }
}

module.exports = { generate, name: "free", label: "Groq · Llama 3.1" };
