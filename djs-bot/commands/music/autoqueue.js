const colors = require("colors");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const { autoQueueEmbed } = require("../../util/embeds");

const command = new SlashCommand()
	.setName("autoqueue")
	.setDescription("Adicionar músicas automaticamente à fila (alternar)")
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
						.setDescription("Não há nada reproduzindp na fila"),
				],
				ephemeral: true,
			});
		}
		
		const autoQueue = player.get("autoQueue");
		player.set("requester", interaction.guild.members.me);
		
		if (!autoQueue || autoQueue === false) {
			player.set("autoQueue", true);
		} else {
			player.set("autoQueue", false);
		}

		client.warn(
			`Reprodutor: ${ player.options.guild } | [${ colors.blue(
				"AUTOQUEUE",
			) }] foi [${ colors.blue(!autoQueue? "ENABLED" : "DISABLED") }] em ${
				client.guilds.cache.get(player.options.guild)
					? client.guilds.cache.get(player.options.guild).name
					: "pela guilda"
			}`,
		);
		
		return interaction.reply({ embeds: [autoQueueEmbed({autoQueue})] });
	});

module.exports = command;
