const colors = require("colors");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
	.setName("247")
	.setDescription("Impede que o bot se desconecte de um VC (alternar)")
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
						.setDescription("Não há nada para reproduzir 24/7."),
				],
				ephemeral: true,
			});
		}
		
		let twentyFourSevenEmbed = new EmbedBuilder().setColor(
			client.config.embedColor,
		);
		const twentyFourSeven = player.get("twentyFourSeven");
		
		if (!twentyFourSeven || twentyFourSeven === false) {
			player.set("twentyFourSeven", true);
		} else {
			player.set("twentyFourSeven", false);
		}
		twentyFourSevenEmbed
		  .setDescription(`**Modo 24/7 está** \`${!twentyFourSeven ? "ON" : "OFF"}\``)
		  .setFooter({
		    text: `O bot irá ${!twentyFourSeven ? "agora": "não mais"} ficar conectado ao canal de voz 24/7.`
      });
		client.warn(
			`Reprodutor: ${ player.options.guild } | [${ colors.blue(
				"24/7",
			) }] foi [${ colors.blue(
				!twentyFourSeven? "ENABLED" : "DISABLED",
			) }] em ${
				client.guilds.cache.get(player.options.guild)
					? client.guilds.cache.get(player.options.guild).name
					: "pela guilda"
			}`,
		);
		
		if (!player.playing && player.queue.totalSize === 0 && twentyFourSeven) {
			player.destroy();
		}
		
		return interaction.reply({ embeds: [twentyFourSevenEmbed] });
	});

module.exports = command;
