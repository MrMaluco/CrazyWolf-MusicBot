const SlashCommand = require("../lib/SlashCommand");
const { ccInteractionHook } = require("../util/interactions");
const playerUtil = require("../util/player");
const { redEmbed } = require("../util/embeds");

const command = new SlashCommand()
	.setName("next")
	.setCategory("cc")
	.setDescription("Próxima interação")
	.setRun(async (client, interaction, options) => {
		const { error, data } = await ccInteractionHook(client, interaction);

		if (error || !data || data instanceof Promise) return data;

		const { player, channel, sendError } = data;

		const song = player.queue.current;
		const status = playerUtil.skip(player);

		if (status === 1) {
			return interaction.reply({
				embeds: [
					redEmbed({
						desc: `Não há nada depois de [${song.title}](${song.uri}) na fila.`,
					}),
				],
				ephemeral: true,
			});
		}

		return interaction.deferUpdate();
	});

module.exports = command;
