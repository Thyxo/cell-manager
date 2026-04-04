require("dotenv").config();
const { Client, GatewayIntentBits, Collection, Events } = require("discord.js");
const { io } = require("socket.io-client");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});
client.commands = new Collection();

// Load slash commands
const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`📋 Loaded command: ${command.data.name}`);
  }
}

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    const msg = { content: "❌ An error occurred.", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
});

// Socket.IO — listen for live cell updates → check notifications
const socket = io(process.env.BACKEND_URL || "http://localhost:4000");

socket.on("connect", () => console.log("🔗 Bot connected to backend socket"));

socket.on("cells:updated", async (cells) => {
  await checkNotifications(cells);
});

// Notification check logic
async function checkNotifications(cells) {
  try {
    const configRes = await fetch(`${process.env.BACKEND_URL || "http://localhost:4000"}/api/config`);
    const config = await configRes.json();
    const threshold = config.notificationThreshold ?? 2;
    const mode = config.notificationMode ?? "dm";
    const channelId = config.notificationChannelId;

    for (const cell of cells) {
      if (cell.daysLeft <= threshold && !cell.notified && cell.discordUserId) {
        try {
          if (mode === "dm") {
            const user = await client.users.fetch(cell.discordUserId);
            await user.send({
              embeds: [buildNotificationEmbed(cell)],
            });
          } else if (mode === "channel" && channelId) {
            const channel = await client.channels.fetch(channelId);
            await channel.send({
              content: `<@${cell.discordUserId}>`,
              embeds: [buildNotificationEmbed(cell)],
            });
          }
          // Mark as notified
          await fetch(
            `${process.env.BACKEND_URL || "http://localhost:4000"}/api/cells/${encodeURIComponent(cell.cellName)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...cell, notified: true }),
            }
          );
          console.log(`📨 Notified ${cell.discordUserId} for cell ${cell.cellName}`);
        } catch (e) {
          console.error(`Failed to notify for ${cell.cellName}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error("Notification check error:", err.message);
  }
}

function buildNotificationEmbed(cell) {
  const { EmbedBuilder } = require("discord.js");
  const urgencyColor = cell.daysLeft <= 1 ? 0xff0000 : cell.daysLeft <= 2 ? 0xff8c00 : 0xffcc00;
  return new EmbedBuilder()
    .setColor(urgencyColor)
    .setTitle(`⚠️ Cell Expiring Soon — ${cell.cellName}`)
    .setThumbnail(`https://mc-heads.net/avatar/${cell.accountName}`)
    .setDescription(
      `Your Minecraft cell is expiring!\n\n` +
        `**Account:** ${cell.accountName}\n` +
        `**Rank:** ${cell.rank}\n` +
        `**Block:** ${cell.block}\n` +
        `**Days Left:** ${cell.daysLeft} ${cell.daysLeft === 1 ? "day" : "days"} ⏰`
    )
    .setFooter({ text: "Minecraft Cell Manager" })
    .setTimestamp();
}

client.once(Events.ClientReady, (c) => {
  console.log(`🤖 Bot ready as ${c.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
