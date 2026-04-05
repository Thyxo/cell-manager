const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ce_remove")
    .setDescription("Remove a Minecraft cell")
    .addStringOption((o) => o.setName("cell_name").setDescription("Cell number of the cell to remove").setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const cellName = interaction.options.getString("cell_name");

    try {
      const res = await fetch(
        `${process.env.BACKEND_URL || "http://localhost:4000"}/api/cells/${encodeURIComponent(cellName)}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete cell");

      const embed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle(`🗑️ Cell Removed`)
        .setDescription(`Cell **${cellName}** has been successfully deleted.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
  },
};
