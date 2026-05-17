const express = require("express");
const router = express.Router();

// Lookup a Discord user by username within the configured guild
// GET /api/discord/lookup?username=dryton
router.get("/lookup", async (req, res) => {
  const { username } = req.query;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: "username query param is required" });
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    return res.status(500).json({
      error: "DISCORD_BOT_TOKEN and DISCORD_GUILD_ID must be set on the backend",
    });
  }

  try {
    // Use Discord's guild member search endpoint
    const searchUrl = `https://discord.com/api/v10/guilds/${guildId}/members/search?query=${encodeURIComponent(username.trim())}&limit=5`;
    const response = await fetch(searchUrl, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Discord API error:", response.status, errBody);
      return res.status(502).json({ error: "Discord API request failed" });
    }

    const members = await response.json();

    if (!members.length) {
      return res.json({ found: false, users: [] });
    }

    // Return matching users with their id, username, display name, and avatar
    const users = members.map((m) => ({
      id: m.user.id,
      username: m.user.username,
      displayName: m.nick || m.user.global_name || m.user.username,
      avatar: m.user.avatar
        ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=64`
        : `https://cdn.discordapp.com/embed/avatars/${(BigInt(m.user.id) >> 22n) % 6n}.png`,
    }));

    res.json({ found: true, users });
  } catch (err) {
    console.error("Discord lookup error:", err.message);
    res.status(500).json({ error: "Failed to lookup Discord user" });
  }
});

module.exports = router;
