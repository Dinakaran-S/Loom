const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const logger = require("../utils/logger");
const projectModel = require("../models/project.model");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.cors.origin, credentials: true },
  });

  // Require a valid access token to open a socket at all — status streams
  // can include task descriptions/error messages, not meant to be public.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing auth token"));
    try {
      socket.user = jwt.verify(token, env.jwt.accessSecret);
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info("ws_connected", { userId: socket.user.id });

    // Client asks to watch a specific project's task graph run.
    socket.on("join_project", async (projectId) => {
      if (typeof projectId !== "string") return;
      const project = await projectModel.findByIdForUser(projectId, socket.user.id);
      if (!project) return socket.emit("socket_error", { message: "Project not found" });
      socket.join(`project:${projectId}`);
    });

    socket.on("leave_project", (projectId) => {
      if (typeof projectId !== "string") return;
      socket.leave(`project:${projectId}`);
    });

    socket.on("disconnect", () => {
      logger.info("ws_disconnected", { userId: socket.user.id });
    });
  });

  return io;
}

module.exports = { initSocket };
