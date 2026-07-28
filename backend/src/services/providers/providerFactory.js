const claudeProvider = require("./claudeProvider");
const groqProvider = require("./groqProvider");

const providers = {
  paid: claudeProvider,
  free: groqProvider,
};

function getProvider(kind) {
  return providers[kind] || providers.free;
}

module.exports = { getProvider };
