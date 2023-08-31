const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const playerUtil = require("../../util/player");
const { redEmbed } = require("../../util/embeds");

const command = new SlashCommand()
	.setName("skip")
	.setDescription("Pular a música atual")
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!channel) {
			return;
		}

		let player;
		if (client.manager.Engine) {
			player = client.manager.Engine.players.get(interaction.guild.id);
		} else {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("O nó Lavalink não está conectado"),
				],
			});
		}

		if (!player) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("Não há nada para pular."),
				],
				ephemeral: true,
			});
		}

		const song = player.queue.current;

		const status = playerUtil.skip(player);

		if (status === 1) {
			return interaction.reply({
				embeds: [
					redEmbed(
						`Não há nada depois de [${song.title}](${song.uri}) na fila.`
					),
				],
			});
		}

		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("✅ | **Pulada!**"),
			],
		});
	});

module.exports = command;
