const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");

const command = new SlashCommand()
	.setName("save")
	.setDescription("Salva a música atual no seu DM")
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
						.setDescription("Não há música tocando no momento."),
				],
				ephemeral: true,
			});
		}
		
		const sendtoDmEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setAuthor({
				name: "Música salva",
				iconURL: `${ interaction.user.displayAvatarURL({ dynamic: true }) }`,
			})
			.setDescription(
				`**[${ player.queue.current.title }](${ player.queue.current.uri }) salvo em seu DM**`,
			)
			.addFields(
				{
					name: "Duração da música",
					value: `\`${ prettyMilliseconds(player.queue.current.duration, {
						colonNotation: true,
					}) }\``,
					inline: true,
				},
				{
					name: "Author",
					value: `\`${ player.queue.current.author }\``,
					inline: true,
				},
				{
					name: "Pedido pela Guilda",
					value: `\`${ interaction.guild }\``,
					inline: true,
				},
			);
		
		interaction.user.send({ embeds: [sendtoDmEmbed] });
		
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(
						"Por favor, verifique seus **DMs**. Se você não recebeu nenhuma mensagem minha, certifique-se de que seus **DMs** estejam abertos",
					),
			],
			ephemeral: true,
		});
	});

module.exports = command;
