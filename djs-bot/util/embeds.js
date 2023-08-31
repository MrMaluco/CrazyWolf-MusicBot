const { getClient } = require("../bot");
const prettyMilliseconds = require("pretty-ms");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { escapeMarkdown } = require("discord.js");

/**
 * @typedef {object} ColorEmbedParams
 * @property {import("discord.js").ColorResolvable} color
 * @property {string} desc
 *
 * @param {ColorEmbedParams}
 */
const colorEmbed = ({ color, desc }) => {
  if (!desc?.length) throw new Error("[colorEmbed] Nenhuma descrição fornecida");

  return new EmbedBuilder()
    .setColor(color || getClient().config.embedColor)
    .setDescription(desc);
};

/**
 * @param {ColorEmbedParams}
 */
const successEmbed = ({ color, desc = "Sucesso" } = {}) =>
  colorEmbed({ color: color, desc: `✅ | **${desc}**` });

/**
 * @param {ColorEmbedParams}
 */
const errorEmbed = ({ color, desc = "Error" } = {}) =>
  colorEmbed({ color: color, desc: `❌ | **${desc}**` });

/**
 * @param {ColorEmbedParams} options
 */
const redEmbed = (options = {}) => colorEmbed({ color: "Red", ...options });

const embedNoLLNode = () =>
  redEmbed({
    desc: "O nó Lavalink não está conectado",
  });

const embedNoTrackPlaying = () =>
  redEmbed({
    desc: "Nada está tocando agora.",
  });

const embedNotEnoughTrackToClear = () =>
  errorEmbed({
    desc: "Inválido, música insuficiente para ser apagada.",
  });

const embedClearedQueue = () =>
  successEmbed({
    desc: "Limpou a fila!",
  });

/**
 * @typedef {object} TrackStartedEmbedParams
 * @property {import("cosmicord.js").CosmiTrack=} track
 *
 * @param {TrackStartedEmbedParams}
 */
const trackStartedEmbed = ({ track, player } = {}) => {
  const client = getClient();

  const embed = new EmbedBuilder().setColor(client.config.embedColor);

  if (track) {
    embed
      .setAuthor({ name: "Tocando agora", iconURL: client.config.iconURL })
      .setDescription(`[${track.title}](${track.uri})`)
      .addFields([
        {
          name: "Pedido por",
          value: `${track.requester}`,
          inline: true,
        },
        {
          name: "Duração",
          value: track.isStream
            ? `\`LIVE\``
            : `\`${prettyMilliseconds(track.duration, {
                secondsDecimalDigits: 0,
              })}\``,
          inline: true,
        },
      ]);

    try {
      embed.setThumbnail(track.displayThumbnail("maxresdefault"));
    } catch (err) {
      embed.setThumbnail(track.thumbnail);
    }

    if (player) addPlayerStateFooter(player, embed);
  } else {
    // !TODO: finish this
    embed
      .setTitle("Nenhuma música tocando no momento")
      .setImage(
        "https://cdn.discordapp.com/avatars/788006279837909032/e4cf889f9fe19f9b4dd5301d51bddcb2.webp?size=4096"
      );
  }

  return embed;
};

/**
 * @typedef {object} ControlChannelMessageParams
 * @property {string} guildId
 * @property {TrackStartedEmbedParams["track"]} track
 *
 * @param {ControlChannelMessageParams}
 * @returns {import("discord.js").MessagePayload | import("discord.js").MessageCreateOptions}
 */
const controlChannelMessage = ({ guildId, track } = {}) => {
  const player = guildId
    ? getClient().manager.Engine.players.get(guildId)
    : undefined;

  const prev = new ButtonBuilder()
    .setCustomId("cc/prev")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("⏮️");

  const playpause = new ButtonBuilder()
    .setCustomId("cc/playpause")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("⏯️");

  const stop = new ButtonBuilder()
    .setCustomId("cc/stop")
    .setStyle(ButtonStyle.Danger)
    .setEmoji("⏹️");

  const next = new ButtonBuilder()
    .setCustomId("cc/next")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("⏭️");

  const firstRow = new ActionRowBuilder().addComponents(
    prev,
    playpause,
    stop,
    next
  );

  const lowerVolume = new ButtonBuilder()
    .setCustomId("cc/vlower")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("🔉");

  const louderVolume = new ButtonBuilder()
    .setCustomId("cc/vlouder")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("🔊");

  const autoqueue = new ButtonBuilder()
    .setCustomId("cc/autoqueue")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("♾️");

  const secondRow = new ActionRowBuilder().addComponents(
    lowerVolume,
    louderVolume,
    autoqueue
  );

  const components = [firstRow, secondRow];

  return {
    content: "Junte-se a um canal de voz e coloque músicas na fila por nome ou URL aqui.",
    embeds: [trackStartedEmbed({ track, player })],
    components,
  };
};

/**
 * @typedef {object} AddQueueEmbedParams
 * @property {import("cosmicord.js").CosmiTrack} track
 * @property {import("../lib/clients/MusicClient").CosmicordPlayerExtended} player
 * @property {string} requesterId
 *
 * @param {AddQueueEmbedParams}
 */
const addQueueEmbed = ({ track, player, requesterId }) => {
  const client = getClient();

  const title = escapeMarkdown(track.title).replace(/\]|\[/g, "");

  const embed = new EmbedBuilder()
    .setColor(client.config.embedColor)
    .setAuthor({ name: "Adicionado à fila", iconURL: client.config.iconURL })
    .setDescription(`[${title}](${track.uri})` || "Sem Nome")
    .setURL(track.uri)
    .addFields([
      {
        name: "Pedido por",
        value: `<@${requesterId}>`,
        inline: true,
      },
      {
        name: "Duração",
        value: track.isStream
          ? `\`LIVE 🔴 \``
          : `\`${client.ms(track.duration, {
              colonNotation: true,
              secondsDecimalDigits: 0,
            })}\``,
        inline: true,
      },
    ]);

  try {
    embed.setThumbnail(track.displayThumbnail("maxresdefault"));
  } catch (err) {
    embed.setThumbnail(track.thumbnail);
  }

  if (player.queue.totalSize > 1) {
    embed.addFields([
      {
        name: "Posição na fila",
        value: `${player.queue.size}`,
        inline: true,
      },
    ]);
  }

  return embed;
};

/**
 * @typedef {object} LoadedPlaylistEmbedParams
 * @property {import("cosmicord.js").CosmiLoadedTracks} searchResult
 * @property {string} query
 *
 * @param {LoadedPlaylistEmbedParams}
 */
const loadedPlaylistEmbed = ({ searchResult, query }) => {
  const client = getClient();

  const embed = new EmbedBuilder()
    .setColor(client.config.embedColor)
    .setAuthor({
      name: "Playlist adicionada à fila",
      iconURL: client.config.iconURL,
    })
    .setThumbnail(searchResult.tracks[0].thumbnail)
    .setDescription(`[${searchResult.playlist.name}](${query})`)
    .addFields([
      {
        name: "Enfileirado",
        value: `\`${searchResult.tracks.length}\` músicas`,
        inline: true,
      },
      {
        name: "Duração da playlist",
        value: `\`${client.ms(searchResult.playlist.duration, {
          colonNotation: true,
          secondsDecimalDigits: 0,
        })}\``,
        inline: true,
      },
    ]);

  return embed;
};

const autoQueueEmbed = ({ autoQueue }) => {
  const client = getClient();
  return new EmbedBuilder()
    .setColor(client.config.embedColor)
    .setDescription(`**A fila automática está** \`${!autoQueue ? "ON" : "OFF"}\``)
    .setFooter({
      text: `Músicas relacionadas serão ${
        !autoQueue ? "agora automaticamente": "não mais"
      } adicionado à fila.`,
    });
};

/**
 * @param {import("../lib/clients/MusicClient").CosmicordPlayerExtended} player
 * @param {EmbedBuilder} embed
 */
const addPlayerStateFooter = (player, embed) => {
  const states = [
    ["autoqueue", !!player.get("autoQueue")],
    ["24/7", !!player.get("twentyFourSeven")],
  ];

  const shownStates = states.filter((state) => state[1]);

  if (shownStates.length)
    embed.setFooter({
      text: shownStates.map((state) => state[0]).join(" • "),
    });
};

module.exports = {
  successEmbed,
  errorEmbed,
  colorEmbed,
  redEmbed,
  embedNoLLNode,
  embedNoTrackPlaying,
  embedNotEnoughTrackToClear,
  embedClearedQueue,
  controlChannelMessage,
  trackStartedEmbed,
  addQueueEmbed,
  loadedPlaylistEmbed,
  autoQueueEmbed,
  addPlayerStateFooter,
};
