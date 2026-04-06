const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ce_guide')
        .setDescription('Sender en guide til hvordan Celle-Manager systemet fungerer'),

    async execute(interaction) {
        // Vi bruger path.join med __dirname for at få den relative sti.
        // Dette gør, at botten kan finde billedet lige meget hvilken computer eller server den kører på (f.eks. efter den er lagt på GitHub).
        const imagePath = path.join(__dirname, 'Dashboard.png');
        const file = new AttachmentBuilder(imagePath, { name: 'Dashboard.png' });

        const embed = new EmbedBuilder()
            .setAuthor({
                name: "Celle-Manager",
            })
            .setTitle("Hvordan bruger man Celle-Manager")
            .setURL("https://cell-manager-dashboard.vercel.app/")
            .setDescription("Celle-Manager er et fullstack system, som er lavet til at vi kan holde styr på vores celler. Det er ikke så sjovt at miste dem, fordi man glemmer at logge ind...\n\n**Systemet** er bygget til at være \"bruger-venligt\" så det burde ikke være så svært for jer nødder at bruge det. Der er en discord-bot, som man kan bruge forskellige kommandoer med, de står forklaret neden under.\n**Hjemmesiden** minder meget om, der er et rart og overskueligt Dashboard, hvor man nemt kan se alle cellerne. De er sorteret ift. dage, så mindste står først. \nMan kan selvfølgelig også tilføje, opdatere og fjerne celler på Dashboardet, det gør man oppe i højre hjørne på \"+ADD\". Der guider den dig også igennem hvad du skal. Ved Discord-brugernavnet skriver man bare sit username.\n**24/7** Det hele burde meget gerne køre hele tiden, men det må vi se med tiden.\n\n[**Kom til hjemmesiden her**](https://cell-manager-dashboard.vercel.app/)\n\n**Her kommer en forklaring på alle kommandoerne**")
            .addFields(
                {
                    name: "/ce_add",
                    value: "Den er meget lige til, du starter med at skrive cellens nummer/navn fx. a123, så navnet på det account der ejer cellen, hvilken rank accountet har, altså Madchemist, Legend eller Titan, hvilken blok accountet er i A B eller C, hvor mange dage der er på cellen, og sidst men ikke mindst, hvilken discord bruger der skal modtage notifikationen når cellen løber ud.",
                    inline: false
                },
                {
                    name: "/ce_remove",
                    value: "Den fjerner cellen, du skal skrive navnet/nummeret på cellen.",
                    inline: false
                },
                {
                    name: "/ce_update_days",
                    value: "Den her skal man bruge når man køber flere dage på cellen. Når du har købt dage, bruger du kommandoen og skriver fx 9.",
                    inline: false
                },
                {
                    name: "/ce_list",
                    value: "Den sender en liste over alle de registrerede celler.",
                    inline: false
                },
                {
                    name: "/ce_live_list",
                    value: "Den sender en liste over alle cellerne hver 12. time i den kanal som kommandoen blev skrevet i. Skal ikke bruges.",
                    inline: false
                },
            )
            .setImage("attachment://Dashboard.png")
            .setColor("#00b0f4")
            .setFooter({
                text: "Husk at købe dage på cellerne",
            })
            .setTimestamp();

        // Vi sender embed og det vedhæftede billede som ét svar
        await interaction.reply({ embeds: [embed], files: [file] });
    }
};