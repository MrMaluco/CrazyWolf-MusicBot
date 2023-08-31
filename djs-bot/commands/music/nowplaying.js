const { EmbedBuilder, escapeMarkdown } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const prettyMilliseconds = require("pretty-ms");

const command = new SlashCommand()
	.setName("nowplaying")
	.setDescription("Mostra a música atualmente tocando no canal de voz.")
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
						.setDescription("O bot não está em um canal."),
				],
				ephemeral: true,
			});
		}
		
		if (!player.playing) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("Não há nada tocando."),
				],
				ephemeral: true,
			});
		}
		
		const song = player.queue.current;
        var title = escapeMarkdown(song.title)
        var title = title.replace(/\]/g,"")
        var title = title.replace(/\[/g,"")
		const embed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setAuthor({ name: "Tocando agora", iconURL: client.config.iconURL })
			// mostra quem solicitou a música via setField, mostra também a duração da música
			.setFields([
				{
					name: "Pedido por",
					value: `<@${ song.requester.id }>`,
					inline: true,
				},
				// duração do show, se ao vivo show ao vivo
				{
					name: "Duração",
					value: song.isStream
						? `\`LIVE\``
						: `\`${ prettyMilliseconds(player.position, {
							secondsDecimalDigits: 0,
						}) } / ${ prettyMilliseconds(song.duration, {
							secondsDecimalDigits: 0,
						}) }\``,
					inline: true,
				},
			])
			// mostre a miniatura da música usando displayThumbnail("maxresdefault")
			.setThumbnail(song.displayThumbnail("maxresdefault"))
			// mostre o título da música e o link para ela
			.setDescription(`[${ title }](${ song.uri })`);
		return interaction.reply({ embeds: [embed] });
	});
module.exports = command;
