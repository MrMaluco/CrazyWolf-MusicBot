const { EmbedBuilder } = require("discord.js");

module.exports = {
	name: "ping",
	category: "utility",
	usage: "/ping",
	description: "O bot está lento? Verifique o ping do bot e veja se ele está atrasado ou se você está!",
	ownerOnly: false,
	run: async (client, interaction) => {
		const msg = await interaction.channel.send(`🏓 Pinging...`);
		await interaction.reply({ embeds: [new EmbedBuilder()
			.setTitle(':signal_strength: PONG!')
			.addField("BOT", `\`\`\`yml\n${Math.floor(msg.createdAt - interaction.createdAt)}ms\`\`\``, true)
			.addField("API", `\`\`\`yml\n${client.ws.ping}ms\`\`\``, true)
			.setColor(client.config.embedColor)
			.setTimestamp()] });
		msg.delete();
	},
};