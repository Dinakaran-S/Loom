const http = require("http");
const app = require("./app");
const env = require("./src/config/env");
const logger = require("./src/utils/logger");
const { initSocket } = require("./src/websocket/socket");

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

// Controllers reach the socket instance via req.app.get("io") — keeps the
// orchestrator/controllers free of any direct import of the socket module.
app.set("io", io);

httpServer.listen(env.port, () => {
  logger.info("server_started", { port: env.port, env: env.nodeEnv });
});
