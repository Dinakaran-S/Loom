const router = require("express").Router();
const controller = require("../controllers/orchestrator.controller");
const validate = require("../middleware/validate.middleware");
const { requireAuth } = require("../middleware/auth.middleware");
const { agentGenerateLimiter } = require("../middleware/rateLimiter.middleware");
const {
  createProjectSchema,
  runProjectSchema,
  projectIdParamSchema,
  fileQuerySchema,
} = require("../validators/project.validator");

router.use(requireAuth);

router.post("/", agentGenerateLimiter, validate({ body: createProjectSchema }), controller.createProject);
router.get("/", controller.listProjects);
router.get("/:id", validate({ params: projectIdParamSchema }), controller.getProject);
router.get("/:id/files", validate({ params: projectIdParamSchema }), controller.getFiles);
router.get("/:id/file", validate({ params: projectIdParamSchema, query: fileQuerySchema }), controller.getFile);
router.post(
  "/:id/run",
  agentGenerateLimiter,
  validate({ params: projectIdParamSchema, body: runProjectSchema }),
  controller.runProject
);

module.exports = router;
