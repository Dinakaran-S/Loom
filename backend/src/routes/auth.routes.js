const router = require("express").Router();
const controller = require("../controllers/auth.controller");
const validate = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const { loginLimiter } = require("../middleware/rateLimiter.middleware");

router.post("/register", validate({ body: registerSchema }), controller.register);
router.post("/login", loginLimiter, validate({ body: loginSchema }), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

module.exports = router;
