const colors = require("colors");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("autopause")
  .setDescription("Pausar automaticamente quando todos saírem do canal de voz (alternar)")
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

    let autoPauseEmbed = new EmbedBuilder().setColor(client.config.embedColor);
    const autoPause = player.get("autoPause");
    player.set("requester", interaction.guild.members.me);

    if (!autoPause || autoPause === false) {
      player.set("autoPause", true);
    } else {
      player.set("autoPause", false);
    }
    autoPauseEmbed
			.setDescription(`**A pausa automática está** \`${!autoPause ? "ON" : "OFF"}\``)
			.setFooter({
			  text: `O reprodutor ${!autoPause ? "agora é automaticamente": "não mais será"} pausado quando todos saem do canal de voz.`
			});
    client.warn(
      `Reprodutor: ${player.options.guild} | [${colors.blue(
        "AUTOPAUSE"
      )}] foi [${colors.blue(!autoPause ? "ENABLED" : "DISABLED")}] em ${
        client.guilds.cache.get(player.options.guild)
          ? client.guilds.cache.get(player.options.guild).name
          : "pela guilda"
      }`
    );

    return interaction.reply({ embeds: [autoPauseEmbed] });
  });

module.exports = command;
