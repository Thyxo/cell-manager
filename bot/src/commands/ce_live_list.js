const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fetch = require("node-fetch");

let intervalId = null;
let liveChannelId = null;
let liveMessageId = null;

async function buildEmbeds(backendUrl) {
  const res = await fetch(`${backendUrl}/api/cells`);
  const cells = await res.json();

  if (!cells.length) return null;

  return cells.slice(0, 10).map((cell) => {
    const urgency =
      cell.daysLeft <= 1
        ? 0xff0000
        : cell.daysLeft <= 2
        ? 0xff8c00
        : cell.daysLeft <= 4
        ? 0xffcc00
        : 0x00cc66;

    return new EmbedBuilder()
      .setColor(urgency)
      .setTitle(cell.accountName)
      .setThumbnail(`https://mc-heads.net/avatar/${cell.accountName}`)
      .setDescription(
        `🏷️ **Cell:** ${cell.cellName}\n` +
        `⭐ **Rank:** ${cell.rank}\n` +
        `🧱 **Block:** ${cell.block}\n` +
        `⏰ **Days Left:** ${cell.daysLeft}/9\n` +
        `👤 **Notify:** ${cell.discordUser}`
      )
      .setFooter({ text: `Sidst opdateret` })
      .setTimestamp();
  });
}

async function updateLiveMessage(client, backendUrl) {
  if (!liveChannelId || !liveMessageId) return;

  try {
    const channel = await client.channels.fetch(liveChannelId);
    const message = await channel.messages.fetch(liveMessageId);
    const embeds = await buildEmbeds(backendUrl);

    if (!embeds) {
      await message.edit({ content: "📭 Ingen celler registreret.", embeds: [] });
    } else {
      await message.edit({ content: "", embeds });
    }

    console.log("🔄 Live liste opdateret");
  } catch (err) {
    console.error("Fejl ved opdatering af live liste:", err.message);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ce_live_list")
    .setDescription("Start en live celle-liste der opdateres hver 12. time i denne kanal"),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";

    try {
      const embeds = await buildEmbeds(backendUrl);
      const channel = interaction.channel;

      // Send den første besked
      const message = await channel.send({
        content: "",
        embeds: embeds || [],
      });

      // Gem kanal og besked ID
      liveChannelId = channel.id;
      liveMessageId = message.id;

      // Stop gammelt interval hvis det kører
      if (intervalId) {
        clearInterval(intervalId);
      }

      // Start nyt interval — 12 timer
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      intervalId = setInterval(() => {
        updateLiveMessage(client, backendUrl);
      }, TWELVE_HOURS);

      await interaction.editReply({
        content: `✅ Live liste startet i <#${channel.id}>. Opdateres automatisk hver 12. time.`,
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Fejl: ${err.message}` });
    }
  },
};