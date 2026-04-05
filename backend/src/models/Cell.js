const mongoose = require("mongoose");

const cellSchema = new mongoose.Schema(
  {
    cellName: { type: String, required: true, unique: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    rank: { type: String, required: true, trim: true },
    block: { type: String, required: true, trim: true },
    daysLeft: { type: Number, required: true, min: 0, max: 9, default: 9 },
    discordUser: { type: String, required: true, trim: true }, // Discord user ID or mention
    discordUserId: { type: String, trim: true }, // raw Discord user ID for DMs
    notified: { type: Boolean, default: false }, // has notification been sent?
    lastNotified: { type: Date, default: null }, // timestamp of last notification
  },
  { timestamps: true }
);

// Virtual for avatar URL
cellSchema.virtual("avatarUrl").get(function () {
  return `https://mc-heads.net/avatar/${this.accountName}`;
});

cellSchema.set("toJSON", { virtuals: true });
cellSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Cell", cellSchema);
