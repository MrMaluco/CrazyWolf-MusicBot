const moment = require("moment");
require("moment-duration-format");
const { EmbedBuilder } = require("discord.js")
const Bot = require("../../lib/Bot");

module.exports = {
	name: "nodes",
	category: "utility",
	usage: "/nodes",
	description: "Verifique as estatísticas do nó lavalink do bot!",
	ownerOnly: false,
	/**
	 * 
	 * @param {Bot} client 
	 * @param {import("discord.js").Interaction} interaction 
	 * @returns 
	 */
	run: async (client, interaction) => {
		let lavauptime, lavaram, lavaclientstats;
		
		const statsEmbed = new EmbedBuilder()
		.setTitle(`${client.user.username} Informações dos nós`)
		.setColor(client.config.embedColor)
		
		if (client.manager) {
			for (const [index, lavalinkClient] of client.manager.Engine.nodes.entries()){

				lavaclientstats = lavalinkClient.stats;
				lavacores = lavaclientstats.cpu.cores;
				lavauptime = moment.duration(lavaclientstats.uptime).format("d[ Days]・h[ Hrs]・m[ Mins]・s[ Secs]");
				lavaram = (lavaclientstats.memory.used / 1024 / 1024).toFixed(2);
				lavalloc = (lavaclientstats.memory.allocated / 1024 / 1024).toFixed(2);

				statsEmbed.addField( 
					`${index}`,
					`\`\`\`yml\nUptime: ${lavauptime}\nRAM: ${lavaram} / ${lavalloc}MB\nCPU: ${(lavacores === 1) ? "1 Core" : `${lavacores} Cores`}\nPlaying: ${lavaclientstats.playingPlayers} out of ${lavaclientstats.players}\n\`\`\``,
				)
			}
		} else {
			statsEmbed.setDescription("**O gerenciador Lavalink não foi inicializado na inicialização, não há nós conectados.**")
		}
		return interaction.reply({ embeds: [statsEmbed], ephemeral: true });
	},
};