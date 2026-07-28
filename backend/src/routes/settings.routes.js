const router = require("express").Router();
const controller = require("../controllers/settings.controller");
const validate = require("../middleware/validate.middleware");
const { requireAuth } = require("../middleware/auth.middleware");
const { groqApiKeySchema } = require("../validators/settings.validator");

router.use(requireAuth);
router.get("/providers", controller.getProviderStatus);
router.put("/groq-key", validate({ body: groqApiKeySchema }), controller.saveGroqApiKey);

module.exports = router;
