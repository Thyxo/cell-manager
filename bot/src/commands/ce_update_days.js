const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ce_update_days")
    .setDescription("Update days left for a cell")
    .addStringOption((o) => o.setName("cell_name").setDescription("Name of the cell").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("days").setDescription("New days left (0-9)").setRequired(true).setMinValue(0).setMaxValue(9)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const cellName = interaction.options.getString("cell_name");
    const daysLeft = interaction.options.getInteger("days");

    try {
      const res = await fetch(
        `${process.env.BACKEND_URL || "http://localhost:4000"}/api/cells/${encodeURIComponent(cellName)}/days`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ daysLeft }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update cell");

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`🔄 Days Updated — ${cellName}`)
        .setThumbnail(`https://mc-heads.net/avatar/${data.accountName}`)
        .setDescription(`**${data.accountName}** now has **${daysLeft}** ${daysLeft === 1 ? "day" : "days"} remaining.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
  },
};
