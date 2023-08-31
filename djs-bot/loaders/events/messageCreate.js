const { EmbedBuilder, Message } = require("discord.js");
const Bot = require("../../lib/Bot");
const controlChannel = require("../../util/controlChannel");

// node_modules\discord.js\typings\index.d.ts:3940
// @messageCreate: [message: Message];
/**
 * 
 * @param {Bot} client 
 * @param {Message} message 
 * @returns {Promise<Message<boolean>>}
 */
module.exports = async (client, message) => {
	const mention = new RegExp(`^<@!?${client.user.id}>( |)$`);
	// Checks if, on every message sent in a server in which the bot is in, the bot is being mentioned and
	// determines if it should behave in a manner or another according to if the user is a bot dev or not
	if (message.content.match(mention)) {
		let timeout;
		let embed = new EmbedBuilder().setColor(client.config.embedColor);
		if (client.config.ownerId.includes(message.author.id)) {
			timeout = 10000;
			embed
			.setTitle("Reinvite")
			.setURL(`https://discord.com/oauth2/authorize?client_id=${client.config.clientId}&permissions=${client.config.permissions}&scope=${client.config.scopes.toString().replace(/,/g, '%20')}`)
		} else {
			timeout = 15000;
			embed
			.setDescription(`Para usar meus comandos use o \`/\` (comando slash).\nPara ver uma lista dos comandos disponíveis digite \`/help\`.\nSe você não consegue ver a lista, certifique-se de estar me usando nos canais apropriados. Se você tiver problemas, entre em contato com um Mod do servidor.`)
			.setThumbnail(`${client.config.iconURL}`)
		}
		embed.setFooter({ text: `A mensagem será excluída em ${timeout / 1000} segundos`});
		return message.channel.send({ embeds: [embed], ephemeral: true }).then(msg => setTimeout(() => msg.delete(), timeout));
	}

	controlChannel.handleMessageCreate(message);
};
