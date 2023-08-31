const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const playerUtil = require("../../util/player");
const { redEmbed } = require("../../util/embeds");

const command = new SlashCommand()
.setName("previous")
.setDescription("Volte para a música anterior.")
.setRun(async (client, interaction) => {
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
					.setDescription("Não há músicas anteriores para esta sessão."),
			],
			ephemeral: true,
		});
	}

	const previousSong = player.queue.previous;
	const status = await playerUtil.playPrevious(player);

	if (status === 1) return interaction.reply({
		embeds: [
			redEmbed({desc: "Não há nenhuma música anterior na fila."}),
		],
	})

	interaction.reply({
		embeds: [
			new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					`⏮ | Música anterior: **${ previousSong.title }**`,
				),
		],
	});
});

module.exports = command;
