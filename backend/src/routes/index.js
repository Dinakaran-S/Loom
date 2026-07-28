const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/agents", require("./agents.routes"));
router.use("/projects", require("./orchestrator.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/health", require("./health.routes"));

module.exports = router;
