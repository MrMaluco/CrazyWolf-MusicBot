const SlashCommand = require("../../lib/SlashCommand");
const {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder
} = require("discord.js");
const { Rlyrics } = require("rlyrics");
const lyricsApi = new Rlyrics();

const command = new SlashCommand()
	.setName("lyrics")
	.setDescription("Obtenha a letra de uma música")
	.addStringOption((option) =>
		option
			.setName("song")
			.setDescription("A música para obter a letra")
			.setRequired(false),
	)
	.setRun(async (client, interaction, options) => {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("🔎 | **Procurando...**"),
			],
		});

		let player;
		if (client.manager.Engine) {
			player = client.manager.Engine.players.get(interaction.guild.id);
		} else {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("O nó Lavalink não está conectado"),
				],
			});
		}

		const args = interaction.options.getString("song");
		if (!args && !player) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("Não há nada jogando"),
				],
			});
		}

		let currentTitle = ``;
		const phrasesToRemove = [
			"Full Video", "Full Audio", "Official Music Video", "Lyrics", "Lyrical Video",
			"Feat.", "Ft.", "Official", "Audio", "Video", "HD", "4K", "Remix", "Lyric Video", "Lyrics Video", "8K",
			"High Quality", "Animation Video", "\\(Official Video\\. .*\\)", "\\(Music Video\\. .*\\)", "\\[NCS Release\\]",
			"Extended", "DJ Edit", "with Lyrics", "Lyrics", "Karaoke",
			"Instrumental", "Live", "Acoustic", "Cover", "\\(feat\\. .*\\)"
		];
		if (!args) {
			currentTitle = player.queue.current.title;
			currentTitle = currentTitle
				.replace(new RegExp(phrasesToRemove.join('|'), 'gi'), '')
				.replace(/\s*([\[\(].*?[\]\)])?\s*(\|.*)?\s*(\*.*)?$/, '');
		}
		let query = args ? args : currentTitle;

		/** @type {{label:string, description:string, value:string}[]}*/
		let lyricsResults = [];

		lyricsApi.search(query).then(async (lyricsData) => {
			if (lyricsData.length !== 0) {
				for (let i = 0; i <= 25; i++) {
					if (lyricsData[i]) {
						lyricsResults.push({
							label: `${lyricsData[i].title}`,
							description: `${lyricsData[i].artist}`,
							value: i.toString()
						});
					} else { break }
				}

				const menu = new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId("choose-lyrics")
						.setPlaceholder("Escolha uma música")
						.addOptions(lyricsResults),
				);

				let selectedLyrics = await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setColor(client.config.embedColor)
							.setDescription(
								`Aqui estão alguns dos resultados que encontrei para \`${query}\`. Escolha uma música para exibir a letra em \`30 segundos\`.`
							),
					], components: [menu],
				});

				const filter = (button) => button.user.id === interaction.user.id;

				const collector = selectedLyrics.createMessageComponentCollector({
					filter,
					time: 30000,
				});

				collector.on("collect", async (interaction) => {
					if (interaction.isStringSelectMenu()) {
						await interaction.deferUpdate();
						const url = lyricsData[parseInt(interaction.values[0])].url;

						lyricsApi.find(url).then((lyrics) => {
							let lyricsText = lyrics.lyrics;
							
							if (lyricsText.length === 0) {
								lyricsText = `**Infelizmente não estamos autorizados a mostrar essas letras.**`
							} else if (lyricsText.length > 4096) {
								lyricsText = lyricsText.substring(0, 4045) + "\n\n[...]\nTruncada, a letra era muito longa."
							}

							const button = new ActionRowBuilder()
								.addComponents(
									new ButtonBuilder()
										.setCustomId('tipsbutton')
										.setLabel('Tips')
										.setEmoji(`📌`)
										.setStyle(ButtonStyle.Secondary),
									new ButtonBuilder()
										.setLabel('Source')
										.setURL(url)
										.setStyle(ButtonStyle.Link),
								);

							const musixmatch_icon = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Musixmatch_logo_icon_only.svg/480px-Musixmatch_logo_icon_only.svg.png';
							let lyricsEmbed = new EmbedBuilder()
								.setColor(client.config.embedColor)
								.setTitle(`${lyrics.name}`)
								.setURL(url)
								.setThumbnail(lyrics.icon)
								.setFooter({
									text: 'Lyrics provided by MusixMatch.',
									iconURL: musixmatch_icon
								})
								.setDescription(lyricsText);

							return interaction.editReply({
								embeds: [lyricsEmbed],
								components: [button],
							});

						})
					}
				});

				collector.on("end", async (i) => {
					if (i.size == 0) {
						selectedLyrics.edit({
							content: null,
							embeds: [
								new EmbedBuilder()
									.setDescription(
										`Nenhuma música está selecionada. Você demorou muito para selecionar uma faixa.`
									)
									.setColor(client.config.embedColor),
							], components: [],
						});
					}
				});

			} else {
				const button = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setEmoji(`📌`)
							.setCustomId('tipsbutton')
							.setLabel('Tips')
							.setStyle('Secondary'),
					);
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setColor("Red")
							.setDescription(
								`Nenhum resultado encontrado para \`${query}\`!\nCertifique-se de ter digitado sua pesquisa corretamente.`,
							),
					], components: [button],
				});
			}
		}).catch((err) => {
			console.error(err);
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription(
							`Ocorreu um erro desconhecido, verifique seu console.`,
						),
				],
			});
		});

		const collector = interaction.channel.createMessageComponentCollector({
			time: 1000 * 3600
		});

		collector.on('collect', async interaction => {
			if (interaction.customId === 'tipsbutton') {
				await interaction.deferUpdate();
				await interaction.followUp({
					embeds: [
						new EmbedBuilder()
							.setTitle(`Lyrics Tips`)
							.setColor(client.config.embedColor)
							.setDescription(
								`Aqui estão algumas dicas para obter as letras das músicas corretamente \n\n\
                                1. Tente adicionar o nome do artista antes do nome da música.\n\
                                2. Tente pesquisar as letras manualmente, fornecendo a consulta da música usando o teclado.\n\
                                3. Evite pesquisar letras em outros idiomas que não o inglês.`,
							),
					], ephemeral: true, components: []
				});
			};
		});
	});

module.exports = command;
