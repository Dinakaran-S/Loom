const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const credentialService = require("../services/credential.service");

const getProviderStatus = asyncHandler(async (req, res) => {
  return success(res, {
    groqConfigured: Boolean(env.providers.groqApiKey) || await credentialService.hasGroqKey(req.user.id),
    groqModel: env.providers.groqModel,
  });
});

const saveGroqApiKey = asyncHandler(async (req, res) => {
  await credentialService.saveGroqKey(req.user.id, req.body.apiKey);
  return success(res, { groqConfigured: true, groqModel: env.providers.groqModel }, "Groq API key saved securely");
});

module.exports = { getProviderStatus, saveGroqApiKey };
