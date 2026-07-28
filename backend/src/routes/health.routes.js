const router = require("express").Router();
const { checkConnection } = require("../config/db");

router.get("/", async (req, res) => {
  const dbOk = await checkConnection();
  const status = dbOk ? 200 : 503;
  res.status(status).json({
    success: dbOk,
    data: { db: dbOk ? "connected" : "unreachable", uptime: process.uptime() },
  });
});

module.exports = router;
