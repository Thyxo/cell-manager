const express = require("express");
const router = express.Router();
const Cell = require("../models/Cell");

// GET all cells (sorted by daysLeft asc)
router.get("/", async (req, res) => {
  try {
    const cells = await Cell.find({}).sort({ daysLeft: 1 });
    res.json(cells);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single cell
router.get("/:cellName", async (req, res) => {
  try {
    const cell = await Cell.findOne({ cellName: req.params.cellName });
    if (!cell) return res.status(404).json({ error: "Cell not found" });
    res.json(cell);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create cell
router.post("/", async (req, res) => {
  try {
    const { cellName, accountName, rank, block, daysLeft, discordUser, discordUserId } = req.body;
    const cell = new Cell({ cellName, accountName, rank, block, daysLeft, discordUser, discordUserId });
    await cell.save();
    const cells = await Cell.find({}).sort({ daysLeft: 1 });
    req.io.emit("cells:updated", cells);
    res.status(201).json(cell);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Cell already exists" });
    res.status(400).json({ error: err.message });
  }
});

// PATCH update days
router.patch("/:cellName/days", async (req, res) => {
  try {
    const { daysLeft } = req.body;
    if (daysLeft === undefined || daysLeft < 0 || daysLeft > 9) {
      return res.status(400).json({ error: "daysLeft must be 0-9" });
    }
    const cell = await Cell.findOneAndUpdate(
      { cellName: req.params.cellName },
      { daysLeft, notified: false },
      { new: true }
    );
    if (!cell) return res.status(404).json({ error: "Cell not found" });
    const cells = await Cell.find({}).sort({ daysLeft: 1 });
    req.io.emit("cells:updated", cells);
    res.json(cell);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update full cell
router.put("/:cellName", async (req, res) => {
  try {
    const cell = await Cell.findOneAndUpdate(
      { cellName: req.params.cellName },
      { ...req.body, notified: false },
      { new: true, runValidators: true }
    );
    if (!cell) return res.status(404).json({ error: "Cell not found" });
    const cells = await Cell.find({}).sort({ daysLeft: 1 });
    req.io.emit("cells:updated", cells);
    res.json(cell);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE cell
router.delete("/:cellName", async (req, res) => {
  try {
    const cell = await Cell.findOneAndDelete({ cellName: req.params.cellName });
    if (!cell) return res.status(404).json({ error: "Cell not found" });
    const cells = await Cell.find({}).sort({ daysLeft: 1 });
    req.io.emit("cells:updated", cells);
    res.json({ message: "Cell deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
