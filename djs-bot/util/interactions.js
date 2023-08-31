const { embedNoLLNode, embedNoTrackPlaying } = require("./embeds");

/**
 * @param {import("../lib/Bot")} client
 * @param {import("discord.js").Interaction} interaction
 */
const ccInteractionHook = async (client, interaction) => {
	if (!interaction.isButton()) {
		throw new Error("Tipo de interação inválido para este comando");
	}

	const channel = await client.getChannel(client, interaction, {
		ephemeral: true,
	});

	/**
	 * @template T
	 * @param {T} data
	 */
	const returnError = (data) => {
		return {
			error: true,
			data,
		};
	};

	if (!channel) {
		return returnError(undefined);
	}

	/**
	 * @param {import("discord.js").EmbedBuilder} embed
	 */
	const sendError = (embed) => {
		return interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	};

	if (!client.manager.Engine) {
		return returnError(sendError(embedNoLLNode()));
	}

	const player = client.manager.Engine.players.get(interaction.guild.id);

	if (!player) {
		return returnError(sendError(embedNoTrackPlaying()));
	}

	return { error: false, data: { channel, sendError, player } };
};

const checkPlayerVolume = async (player, interaction) => {
	if (typeof player.volume !== "number")
		return interaction.reply({
			content: "Algo está errado",
			ephemeral: true,
		});
};

module.exports = {
	ccInteractionHook,
	checkPlayerVolume,
};
