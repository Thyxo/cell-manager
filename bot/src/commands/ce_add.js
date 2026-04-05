const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ce_add")
    .setDescription("Add a new Minecraft cell")
    .addStringOption((o) => o.setName("cell_name").setDescription("Cell number").setRequired(true))
    .addStringOption((o) => o.setName("account_name").setDescription("Minecraft username").setRequired(true))
    .addStringOption((o) => o.setName("rank").setDescription("Player rank").setRequired(true))
    .addStringOption((o) => o.setName("block").setDescription("FV Blok").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("days").setDescription("Days left (0-9)").setRequired(true).setMinValue(0).setMaxValue(9)
    )
    .addUserOption((o) => o.setName("discord_user").setDescription("Discord user to notify").setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const cellName = interaction.options.getString("cell_name");
    const accountName = interaction.options.getString("account_name");
    const rank = interaction.options.getString("rank");
    const block = interaction.options.getString("block");
    const daysLeft = interaction.options.getInteger("days");
    const discordUser = interaction.options.getUser("discord_user");

    const payload = {
      cellName,
      accountName,
      rank,
      block,
      daysLeft,
      discordUser: `<@${discordUser.id}>`,
      discordUserId: discordUser.id,
    };

    try {
      const res = await fetch(`${process.env.BACKEND_URL || "http://localhost:4000"}/api/cells`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create cell");

      const embed = new EmbedBuilder()
        .setColor(0x00cc66)
        .setTitle(`✅ Cell Added — ${cellName}`)
        .setThumbnail(`https://mc-heads.net/avatar/${accountName}`)
        .addFields(
          { name: "Account", value: accountName, inline: true },
          { name: "Rank", value: rank, inline: true },
          { name: "Block", value: block, inline: true },
          { name: "Days Left", value: `${daysLeft}`, inline: true },
          { name: "Notify", value: `<@${discordUser.id}>`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
  },
};
