const Bot = require("../lib/Bot");
const { redEmbed } = require("../util/embeds");

// Module checks if you meet the channel requirements to use music commands
/**
 *
 * @param {Bot} client
 * @param {import("discord.js").Interaction} interaction
 * @param {import("discord.js").InteractionReplyOptions} options
 * @returns {Promise<import("discord.js").VoiceBasedChannel>}
 */
module.exports = async (client, interaction, options = {}) => {
	return new Promise(async (resolve) => {
		let errorStr;


		if (!interaction.member.voice.channel) {
			errorStr = "Você deve estar em um canal de voz para usar este comando!";
		}
		else if (
			interaction.guild.members.cache.get(client.user.id).voice.channel &&
			!interaction.guild.members.cache
			.get(client.user.id)
			.voice.channel.equals(interaction.member.voice.channel)
		) {
			errorStr =
				"Você deve estar no mesmo canal de voz que eu para usar este comando!";
		}
		else if (!interaction.member.voice.channel.joinable) {
			errorStr = "Não tenho permissão suficiente para entrar no seu canal de voz!";
		}


		if (errorStr) {
			await interaction.reply({
				embeds: [redEmbed({ desc: errorStr })],
				...options,
			});

			return resolve(false);
		}

		resolve(interaction.member.voice.channel);
	});
};
