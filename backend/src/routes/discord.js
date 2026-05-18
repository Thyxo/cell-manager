const express = require("express");

const router = express.Router();

const DISCORD_API = "https://discord.com/api/v10";

function requireDiscordConfig() {
  const token = process.env.DISCORD_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    const missing = [
      !token && "DISCORD_TOKEN",
      !guildId && "DISCORD_GUILD_ID",
    ].filter(Boolean);
    const error = new Error(`Missing Discord config: ${missing.join(", ")}`);
    error.status = 500;
    throw error;
  }

  return { token, guildId };
}

function formatMember(member) {
  const user = member.user || {};
  const displayName = member.nick || user.global_name || user.username || "Unknown user";

  return {
    id: user.id,
    username: user.username,
    globalName: user.global_name,
    displayName,
    mention: user.id ? `<@${user.id}>` : "",
    avatar: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
      : null,
  };
}

router.get("/members/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < 2) {
      return res.json([]);
    }

    const { token, guildId } = requireDiscordConfig();
    const url = `${DISCORD_API}/guilds/${guildId}/members/search?query=${encodeURIComponent(query)}&limit=8`;
    const discordRes = await fetch(url, {
      headers: { Authorization: `Bot ${token}` },
    });
    const data = await discordRes.json().catch(() => null);

    if (!discordRes.ok) {
      const message = data?.message || `Discord returned ${discordRes.status}`;
      return res.status(discordRes.status).json({ error: message });
    }

    res.json(data.map(formatMember).filter((member) => member.id));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
