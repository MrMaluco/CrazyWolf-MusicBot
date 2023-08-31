const { EmbedBuilder, ComponentType } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const { capitalize } = require("../../util/string");
const yt = require("youtube-sr").default;

async function testUrlRegex(string) {
	return [
		/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
		/^(?:spotify:|https:\/\/[a-z]+\.spotify\.com\/(track\/|user\/(.*)\/playlist\/|playlist\/))(.*)$/,
		/^https?:\/\/(?:www\.)?deezer\.com\/[a-z]+\/(track|album|playlist)\/(\d+)$/,
		/^(?:(https?):\/\/)?(?:(?:www|m)\.)?(soundcloud\.com|snd\.sc)\/(.*)$/,
		/(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/
	].some((regex) => {
		return regex.test(string);
	});
}

module.exports = new SlashCommand()
	.setName("playlists")
	.setDescription("Mostra suas playlists")
	.addStringOption((option) => option
		.setName("operation")
		.setDescription("O que você quer fazer")
		.setRequired(true)
		.setChoices(
			{ name: "Visualizar", value: "view" },
			{ name: "Criar", value: "create" },
			{ name: "Deletar", value: "delete" },
			{ name: "Adicionar", value: "add" },
			{ name: "Remover", value: "remove" },
		)
	)
	.addStringOption((option) => option
		.setName("playlist_name")
		.setDescription("O nome da playlist")
		.setRequired(true)
		.setAutocomplete(true)
	)
	.addStringOption((option) => option
		.setName("song")
		.setDescription("A música que você deseja adicionar/remover")
		.setRequired(false)
		.setAutocomplete(true)
	)
	.setAutocompleteOptions(async (input, index, interaction, client) => {
		if (client.db) {
			if (index == 1) {
				const operation = interaction.options.getString("operation");
				if (operation === 'delete' || operation === 'view' || operation === 'add' || operation === 'remove') {
					const playlists = await client.db.playlist.findMany({
						where: {
							user: {
								id: interaction.user.id
							}
						}
					});
					return playlists.map(playlist => {
						return { name: capitalize(playlist.name), value: playlist.name }
					});
				} else return [];
			} else if (index == 2) {
				const operation = interaction.options.getString("operation");
				if (operation === 'remove') {
					const playlistName = interaction.options.getString("playlist_name");
					if (!playlistName) return [];
					const playlist = await client.db.playlist.findFirst({
						where: {
							name: playlistName,
							userId: interaction.user.id
						}
					});
					if (!playlist) return [];
					const songs = await client.db.song.findMany({
						where: {
							playlistId: playlist.id
						}
					});
					return songs.map(song => {
						return { name: capitalize(song.name), value: song.name }
					});
				} else if (operation === 'add') {
					if (input.length <= 3) return [];
					if (await testUrlRegex(input)) return [{ name: "URL", value: input }];

					const random = "ytsearch"[Math.floor(Math.random() * "ytsearch".length)];
					const results = await yt.search(input || random, { safeSearch: false, limit: 25 });

					const choices = [];
					for (const video of results) {
						choices.push({ name: video.title, value: video.url });
					}
					return choices;
				} else return [];
			}
		} else return [{ name: "DB Unavailable", value: "DB_Error" }];
	})
	.setCategory("music")
	.setUsage("/playlists")
	.setDBMS()
	.setRun(async (client, interaction, options) => {

		const operation = options.getString("operation");

		if (operation === "view") {
			const playlistName = options.getString("playlist_name");
			if (!playlistName) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Você precisa fornecer um nome para a playlist")], ephemeral: true });
			const playlist = await client.db.playlist.findFirst({
				where: {
					name: playlistName,
					userId: interaction.user.id
				}
			});
			if (!playlist) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Você não tem uma playlist com esse nome")], ephemeral: true });
			const songs = await client.db.song.findMany({
				where: {
					playlistId: playlist.id
				}
			});
			if (!songs.length) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Essa playlist está vazia")], ephemeral: true });
			const embed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setTitle(`Músicas em ${playlist.name}`)
				.setDescription(songs.map((song, index) => `${index + 1}. **${song.name}** ${song.artist ?? ""}`).join("\n"))
				.setFooter({ text: `Pedido por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
			return interaction.reply({ embeds: [embed], ephemeral: true });
		} else if (operation === "create") {
			const playlistName = options.getString("playlist_name");
			if (!playlistName) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Você precisa fornecer um nome para a playlist")], ephemeral: true });
			else if (playlistName.length < 3) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("O nome da playlist não pode ter menos de três caracteres")], ephemeral: true });
			else if (playlistName.length > 32) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("O nome da playlist não pode ter mais de 32 caracteres")], ephemeral: true });
			const playlist = await client.db.playlist.create({
				data: {
					name: playlistName,
					user: {
						connectOrCreate: {
							where: {
								id: interaction.user.id
							},
							create: {
								id: interaction.user.id,
								username: interaction.user.username
							},
						},
					}
				}
			});

			return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription(`Playlist criada **${playlist.name}**`)], ephemeral: true });
		} else if (operation === "delete") {
			const playlistName = options.getString("playlist_name");
			if (!playlistName) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Você precisa fornecer um nome para a playlist")], ephemeral: true });
			const playlist = await client.db.playlist.findFirst({
				where: {
					name: playlistName,
					userId: interaction.user.id
				}
			});
			if (!playlist) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Não consegui encontrar uma playlist com esse nome")], ephemeral: true });
			if (playlist.userId !== interaction.user.id) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Você não pode excluir uma playlist que não é sua")], ephemeral: true });

			await client.db.playlist.delete({
				where: {
					id: playlist.id
				}
			});

			return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription(`Playlist excluída **${playlist.name}**`)], ephemeral: true });
		} else if (operation === "add") {
			const playlistName = options.getString("playlist_name");
			const playlist = await client.db.playlist.findFirst({
				where: {
					name: playlistName,
					userId: interaction.user.id
				}
			});

			if (!playlist) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Não consegui encontrar uma playlist com esse nome")], ephemeral: true });
			if (playlist.userId !== interaction.user.id) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Você não pode adicionar músicas a uma playlist que não é sua")], ephemeral: true });

			const song = options.getString("song", true);
			if (!song) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Você precisa fornecer uma música para adicionar")], ephemeral: true });

			const songData = await yt.getVideo(song);
			if (!songData) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Não encontrei uma música com esse nome")], ephemeral: true });

			const songExists = await client.db.song.findFirst({
				where: {
					name: songData.title,
					link: songData.url,
				}
			});

			if (!songExists) {
				const newSong = await client.db.song.create({
					data: {
						name: songData.title,
						link: songData.url,
						artist: songData.channel.name,
					}
				});

				await client.db.playlist.update({
					where: {
						id: playlist.id
					},
					data: {
						songs: {
							connect: {
								id: newSong.id
							}
						}
					}
				});
			} else {
				await client.db.playlist.update({
					where: {
						id: playlist.id
					},
					data: {
						songs: {
							connect: {
								id: songExists.id
							}
						}
					}
				});
			}

			return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription(`Música adicionada **${songData.title}** à playlist **${playlist.name}**`)], ephemeral: true });
		} else if (operation === "remove") {
			const playlistName = options.getString("playlist_name");
			const playlist = await client.db.playlist.findFirst({
				where: {
					name: playlistName,
					userId: interaction.user.id
				}
			});

			if (!playlist) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Não consegui encontrar uma playlist com esse nome")], ephemeral: true });
			if (playlist.userId !== interaction.user.id) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Você não pode remover músicas de uma playlist que não é sua")], ephemeral: true });

			const song = options.getString("song", true);
			if (!song) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Você precisa fornecer uma música para remover")], ephemeral: true });
			const songData = await client.db.song.findFirst({
				where: {
					name: song
				}
			});
			if (!songData) return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription("Não encontrei uma música com esse nome")], ephemeral: true });

			await client.db.playlist.update({
				where: {
					id: playlist.id
				},
				data: {
					songs: {
						disconnect: {
							id: songData.id
						}
					}
				}
			});

			return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.embedColor).setDescription(`**${songData.name}** removido de **${playlist.name}**`)], ephemeral: true });
		}

	});