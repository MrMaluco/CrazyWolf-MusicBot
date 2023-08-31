const SlashCommand = require("../../lib/SlashCommand");
const prettyMilliseconds = require("pretty-ms");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { embedNoLLNode, redEmbed, colorEmbed } = require("../../util/embeds");

const command = new SlashCommand()
  .setName("search")
  .setDescription("Procure uma música")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("A música a ser pesquisada")
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
    let channel = await client.getChannel(client, interaction);
    if (!channel) {
      return;
    }

    let player;
    if (client.manager.Engine) {
      player = client.manager.Engine.createPlayer({
        guildId: interaction.guild.id,
        voiceChannel: channel.id,
        textChannel: interaction.channel.id,
      });
    } else {
      return interaction.reply({
        embeds: [embedNoLLNode()],
      });
    }
    await interaction.deferReply().catch((_) => {});

    if (player.state !== "CONNECTED") {
      player.connect();
    }

    const search = interaction.options.getString("query");
    let res;

    const sendRedEmbed = (
      desc = "Ocorreu um erro ao pesquisar a música"
    ) => {
      return interaction.reply({
        embeds: [
          redEmbed({
            desc,
          }),
        ],
        ephemeral: true,
      });
    };

    try {
      res = await player.search(search, interaction.user);
      if (res.loadType === "LOAD_FAILED") {
        return sendRedEmbed();
      }
    } catch (err) {
      return sendRedEmbed();
    }

    if (res.loadType == "NO_MATCHES") {
      return sendRedEmbed(`Nenhum resultado encontrado para \`${search}\``);
    } else {
      let max = 10;
      if (res.tracks.length < max) {
        max = res.tracks.length;
      }

      let resultFromSearch = [];

      res.tracks.slice(0, max).map((track) => {
        resultFromSearch.push({
          label: `${track.title}`,
          value: `${track.uri}`,
          description: track.isStream
            ? `LIVE`
            : `${prettyMilliseconds(track.duration, {
                secondsDecimalDigits: 0,
              })} - ${track.author}`,
        });
      });

      const menus = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select")
          .setPlaceholder("Selecione uma música")
          .addOptions(resultFromSearch)
      );

      let choosenTracks = await interaction.editReply({
        embeds: [
          colorEmbed({
            color: client.config.embedColor,
            desc: `Aqui estão alguns dos resultados que encontrei para \`${search}\`. Selecione a música em \`30 segundos\``,
          }),
        ],
        components: [menus],
      });
      const filter = (button) => button.user.id === interaction.user.id;

      const tracksCollector = choosenTracks.createMessageComponentCollector({
        filter,
        time: 30000,
      });
      tracksCollector.on("collect", async (i) => {
        if (i.isSelectMenu()) {
          await i.deferUpdate();
          let uriFromCollector = i.values[0];
          let trackForPlay;

          trackForPlay = await player?.search(
            uriFromCollector,
            interaction.user
          );
          player?.queue?.add(trackForPlay.tracks[0]);
          if (!player?.playing && !player?.paused && !player?.queue?.size) {
            player?.play();
          }
          i.editReply({
            content: null,
            embeds: [
              new EmbedBuilder()
                .setAuthor({
                  name: "Adicionado à fila",
                  iconURL: client.config.iconURL,
                })
                .setURL(res.tracks[0].uri)
                .setThumbnail(res.tracks[0].displayThumbnail("maxresdefault"))
                .setDescription(
                  `[${trackForPlay?.tracks[0]?.title}](${trackForPlay?.tracks[0].uri})` ||
                    "Sem título"
                )
                .addFields(
                  {
                    name: "Adicionado por",
                    value: `<@${interaction.user.id}>`,
                    inline: true,
                  },
                  {
                    name: "Duração",
                    value: res.tracks[0].isStream
                      ? `\`LIVE :red_circle:\``
                      : `\`${client.ms(res.tracks[0].duration, {
                          colonNotation: true,
                        })}\``,
                    inline: true,
                  }
                )
                .setColor(client.config.embedColor),
            ],
            components: [],
          });
        }
      });
      tracksCollector.on("end", async (i) => {
        if (i.size == 0) {
          choosenTracks.edit({
            content: null,
            embeds: [
              colorEmbed({
                color: client.config.embedColor,
                desc: `Nenhuma música selecionada. Você demorou muito para selecionar uma faixa.`,
              }),
            ],
            components: [],
          });
        }
      });
    }
  });

module.exports = command;
