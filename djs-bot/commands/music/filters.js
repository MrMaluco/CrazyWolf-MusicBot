const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

//@TODO update this command to be compatible with cosmicord v1.1.0
const command = new SlashCommand()
	.setName("filters")
	.setDescription("adicionar ou remover filtros")
	.addStringOption((option) =>
		option
			.setName("preset")
			.setDescription("a predefinição a ser adicionada")
			.setRequired(true)
			.addChoices(
				{ name: "Nightcore", value: "nightcore" },
				{ name: "BassBoost", value: "bassboost" },
				{ name: "Vaporwave", value: "vaporwave" },
				{ name: "Pop", value: "pop" },
				{ name: "Soft", value: "soft" },
				{ name: "Treblebass", value: "treblebass" },
				{ name: "Eight Dimension", value: "eightD" },
				{ name: "Karaoke", value: "karaoke" },
				{ name: "Vibrato", value: "vibrato" },
				{ name: "Tremolo", value: "tremolo" },
				{ name: "Reset", value: "off" },
			),
	)
	
	.setRun(async (client, interaction, options) => {
		const args = options.getString("preset")
		
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
						.setDescription("Não há música tocando."),
				],
				ephemeral: true,
			});
		}
		
		// create a new embed
		let filtersEmbed = new EmbedBuilder().setColor(client.config.embedColor);
		
		if (args == "nightcore") {
			filtersEmbed.setDescription("✅ | Nightcore filtro agora está ativo!");
			player.nightcore = true;
		} else if (args == "bassboost") {
			filtersEmbed.setDescription("✅ | BassBoost o filtro está ativado!");
			player.bassboost = true;
		} else if (args == "vaporwave") {
			filtersEmbed.setDescription("✅ | Vaporwave o filtro está ativado!");
			player.vaporwave = true;
		} else if (args == "pop") {
			filtersEmbed.setDescription("✅ | Pop o filtro está ativado!");
			player.pop = true;
		} else if (args == "soft") {
			filtersEmbed.setDescription("✅ | Soft o filtro está ativado!");
			player.soft = true;
		} else if (args == "treblebass") {
			filtersEmbed.setDescription("✅ | Treblebass o filtro está ativado!");
			player.treblebass = true;
		} else if (args == "eightD") {
			filtersEmbed.setDescription("✅ | Eight Dimension o filtro está ativado!");
			player.eightD = true;
		} else if (args == "karaoke") {
			filtersEmbed.setDescription("✅ | Karaoke o filtro está ativado!");
			player.karaoke = true;
		} else if (args == "vibrato") {
			filtersEmbed.setDescription("✅ | Vibrato o filtro está ativado!");
			player.vibrato = true;
		} else if (args == "tremolo") {
			filtersEmbed.setDescription("✅ | Tremolo o filtro está ativado!");
			player.tremolo = true;
		} else if (args == "off") {
			filtersEmbed.setDescription("✅ | EQ foi limpo!");
			player.reset();
		} else {
			filtersEmbed.setDescription("❌ | Filtro inválido!");
		}
		
		return interaction.reply({ embeds: [filtersEmbed] });
	});

module.exports = command;
