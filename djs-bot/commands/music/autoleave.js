const colors = require("colors");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("autoleave")
  .setDescription("Sai automaticamente quando todos saem do canal de voz (alternar)")
  .setRun(async (client, interaction) => {
    let channel = await client.getChannel(client, interaction);
    if (!channel) return;

    let player;
    if (client.manager.Engine)
      player = client.manager.Engine.players.get(interaction.guild.id);
    else
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("O nó Lavalink não está conectado"),
        ],
      });

    if (!player) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("Não há nada reproduzindo na fila"),
        ],
        ephemeral: true,
      });
    }

    let autoLeaveEmbed = new EmbedBuilder().setColor(client.config.embedColor);
    const autoLeave = player.get("autoLeave");
    player.set("requester", interaction.guild.members.me);

    if (!autoLeave || autoLeave === false) {
      player.set("autoLeave", true);
    } else {
      player.set("autoLeave", false);
    }
    autoLeaveEmbed
			.setDescription(`**A saída automática está** \`${!autoLeave ? "ON" : "OFF"}\``)
			.setFooter({
			  text: `O reprodutor ${!autoLeave ? "irá agora automaticamente": "não irá automaticamente"} sair quando o canal de voz estiver vazio`
			});
    client.warn(
      `Reprodutor: ${player.options.guild} | [${colors.blue(
        "autoLeave"
      )}] foi [${colors.blue(!autoLeave ? "ENABLED" : "DISABLED")}] em ${
        client.guilds.cache.get(player.options.guild)
          ? client.guilds.cache.get(player.options.guild).name
          : "pela guilda"
      }`
    );

    return interaction.reply({ embeds: [autoLeaveEmbed] });
  });

module.exports = command;
