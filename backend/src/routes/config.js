const express = require("express");
const router = express.Router();
const Config = require("../models/Config");

const DEFAULTS = {
  notificationThreshold: 2,
  notificationChannelId: "",
  notificationMode: "dm", // 'dm' or 'channel'
};

router.get("/", async (req, res) => {
  try {
    const configs = await Config.find({});
    const result = { ...DEFAULTS };
    for (const c of configs) result[c.key] = c.value;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Config.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
    }
    const configs = await Config.find({});
    const result = { ...DEFAULTS };
    for (const c of configs) result[c.key] = c.value;
    req.io.emit("config:updated", result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
