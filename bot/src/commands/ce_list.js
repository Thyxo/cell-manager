const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ce_list")
    .setDescription("Show all cells as embeds in this channel"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const res = await fetch(`${process.env.BACKEND_URL || "http://localhost:4000"}/api/cells`);
      const cells = await res.json();

      if (!cells.length) {
        return interaction.editReply({ content: "📭 No cells registered yet." });
      }

      const embeds = cells.slice(0, 10).map((cell) => {
        const urgency = cell.daysLeft <= 1 ? 0xff0000 : cell.daysLeft <= 2 ? 0xff8c00 : cell.daysLeft <= 4 ? 0xffcc00 : 0x00cc66;
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
          .setTimestamp();
      });

      await interaction.editReply({ embeds });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
  },
};
