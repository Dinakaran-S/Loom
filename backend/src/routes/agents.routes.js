const router = require("express").Router();
const controller = require("../controllers/agent.controller");
const validate = require("../middleware/validate.middleware");
const { requireAuth } = require("../middleware/auth.middleware");
const { agentGenerateLimiter } = require("../middleware/rateLimiter.middleware");
const {
  agentNameParamSchema,
  generateSchema,
  listRunsQuerySchema,
  runIdParamSchema,
  agentPreferenceSchema,
} = require("../validators/agent.validator");

router.use(requireAuth);

router.get("/preferences", controller.listPreferences);
router.put(
  "/:agentName/preference",
  validate({ params: agentNameParamSchema, body: agentPreferenceSchema }),
  controller.updatePreference
);

router.post(
  "/:agentName/generate",
  agentGenerateLimiter,
  validate({ params: agentNameParamSchema, body: generateSchema }),
  controller.generate
);
router.get("/runs", validate({ query: listRunsQuerySchema }), controller.listRuns);
router.get("/runs/:id", validate({ params: runIdParamSchema }), controller.getRun);

module.exports = router;
