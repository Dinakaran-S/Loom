const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

const getProviderStatus = asyncHandler(async (req, res) => {
  return success(res, {
    groqConfigured: Boolean(env.providers.groqApiKey),
    groqModel: env.providers.groqModel,
  });
});

const saveGroqApiKey = asyncHandler(async (req, res) => {
  // Keep the key only in the backend process. It is never returned to the
  // browser or written to the repository/.env file.
  env.providers.groqApiKey = req.body.apiKey;
  return success(res, { groqConfigured: true, groqModel: env.providers.groqModel }, "Groq API key saved for this session");
});

module.exports = { getProviderStatus, saveGroqApiKey };
