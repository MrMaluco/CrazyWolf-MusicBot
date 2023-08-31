const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("summon")
	.setDescription("Invoca o bot para o canal.")
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!interaction.member.voice.channel) {
			const joinEmbed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					"❌ | **Você deve estar em um canal de voz para usar este comando.**",
				);
			return interaction.reply({ embeds: [joinEmbed], ephemeral: true });
		}
		
		let player = client.manager.Engine.players.get(interaction.guild.id);
		if (!player) {
			player = client.manager.Engine.createPlayer({
				guildId: interaction.guild.id,
				voiceChannel: channel.id,
				textChannel: interaction.channel.id,
			});
			player.connect(true);
		}
		
		if (channel.id !== player.voiceChannel) {
			player.setVoiceChannel(channel.id);
			player.connect();
		}
		
		interaction.reply({
			embeds: [
				new EmbedBuilder().setDescription(`:thumbsup: | **Ingressado com sucesso <#${ channel.id }>!**`),
			],
		});
	});

module.exports = command;
