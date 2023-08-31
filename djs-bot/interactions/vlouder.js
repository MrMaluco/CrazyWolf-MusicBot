const SlashCommand = require("../lib/SlashCommand");
const { ccInteractionHook, checkPlayerVolume } = require("../util/interactions");

const command = new SlashCommand()
	.setName("vlouder")
	.setCategory("cc")
	.setDescription("Interação de volume mais alto")
	.setRun(async (client, interaction, options) => {
		const { error, data } = await ccInteractionHook(client, interaction);

		if (error || !data || data instanceof Promise) return data;

		const { player, channel, sendError } = data;

		// isso provavelmente nunca será executado, mas apenas no caso
		const replied = await checkPlayerVolume(player, interaction);
		if (replied) return replied;

		let vol = player.volume + 20;
		if (vol > 125) vol = 125;

		player.setVolume(vol);

		return interaction.deferUpdate();
	});

module.exports = command;
