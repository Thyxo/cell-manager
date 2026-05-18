const express = require("express");

const router = express.Router();

const DISCORD_API = "https://discord.com/api/v10";

function requireDiscordConfig() {
  const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
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

function defaultAvatar(userId) {
  if (!userId) return null;
  return `https://cdn.discordapp.com/embed/avatars/${(BigInt(userId) >> 22n) % 6n}.png`;
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
      : defaultAvatar(user.id),
  };
}

async function searchGuildMembers(query, limit = 8) {
  const { token, guildId } = requireDiscordConfig();
  const url = `${DISCORD_API}/guilds/${guildId}/members/search?query=${encodeURIComponent(query)}&limit=${limit}`;
  const discordRes = await fetch(url, {
    headers: { Authorization: `Bot ${token}` },
  });
  const data = await discordRes.json().catch(() => null);

  if (!discordRes.ok) {
    const message = data?.message || `Discord returned ${discordRes.status}`;
    const error = new Error(message);
    error.status = discordRes.status;
    throw error;
  }

  return data.map(formatMember).filter((member) => member.id);
}

router.get("/members/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < 2) {
      return res.json([]);
    }

    res.json(await searchGuildMembers(query, 8));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get("/lookup", async (req, res) => {
  try {
    const username = String(req.query.username || "").trim().replace(/^@/, "");
    if (!username) {
      return res.status(400).json({ error: "username query param is required" });
    }

    const users = await searchGuildMembers(username, 5);
    res.json({ found: users.length > 0, users });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
