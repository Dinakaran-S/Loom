const claudeProvider = require("./claudeProvider");
const groqProvider = require("./groqProvider");

const providers = {
  paid: claudeProvider,
  free: groqProvider,
};

function getProvider(kind, options = {}) {
  const provider = providers[kind] || providers.free;
  return {
    ...provider,
    generate: (request) => provider.generate({ ...request, ...options }),
  };
}

module.exports = { getProvider };
