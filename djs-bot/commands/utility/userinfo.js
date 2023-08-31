const { EmbedBuilder } = require("discord.js");

module.exports = {
	name: "userinfo",
	category: "utility",
	usage: "/userinfo <user?>",
	description: "Obtenha informações sobre um usuário ou sobre você mesmo",
	options: [
		{
			name: 'user',
			type: 6, // "USER"
			description: 'Usuário sobre o qual você deseja obter informações. Se omitido, retornará suas informações',
			required: false,
		},
	],
	permissions: [],
	ownerOnly: false,
	run: async (client, interaction, options) => {
		const target = interaction.options.getUser("user") || interaction.user;
		const member = interaction.guild.members.cache.get(target.id);
		const status = {
			offline: "Offline",
			online: "Online",
			idle: "Idle",
			dnd: "Do Not Disturb",
		};

		// Filtering out @everyone role and getting the roles of roles for the member
		const roles = member.roles.cache.map(roles => { if (roles.name != "@everyone") return `<@&${roles.id}>` }).join(' ');

		const embed = new EmbedBuilder()
			.setColor(client.config.embedColor || member.displayHexColor || 'RANDOM')
			.setThumbnail(target.displayAvatarURL({ dynamic: true }))
			.setAuthor({ name: `${target.tag} (${target.id})`, iconURL: target.displayAvatarURL({ dynamic: true })})
			.addField('**Informação do usuário**', [
				`**❯ Nome de usuário:** ${target.username}`,
				`**❯ Discriminador:** ${target.discriminator}`,
				`**❯ ID:** ${target.id}`,
				`**❯ Avatar:** [Link pro avatar](${target.displayAvatarURL({ dynamic: true })})`,
				`**❯ Hora de criação:** ${new Date(target.createdTimestamp).toLocaleString()}`,
				`**❯ Status:** ${status[target.presence?.status]}`,
				`**❯ Bot:** ${target.bot}`
			].join('\n').toString())
			.addField('**Informações dos membros**', [
				`**❯ Função mais alta:** ${member.roles.highest.id === interaction.guild.id ? "None" : `<@&${member.roles.highest.id}>`}`,
				`**❯ Data de adesão ao servidor:** ${new Date(member.joinedTimestamp).toLocaleString()}`,
				`**❯ Funções [${member.roles.cache.size - 1}]:** ${roles}`
			].join('\n').toString())
			.setTimestamp();

		interaction.reply({ embeds: [embed] });
	},
};
