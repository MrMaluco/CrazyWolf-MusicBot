const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require("discord.js");

module.exports = {
	name: "reload",
	category: "utility",
	usage: "/reload",
	description: "Recarregue todos os comandos slash (este é um comando de depuração disponível apenas para o desenvolvedor do bot)",
	ownerOnly: true,
	run: async (client, interaction) => {
		try {
			const CommandSub = fs.readdirSync("./commands") // Relative Path: "../commands"
			const CommandsDir = path.join(__dirname, "..");
			for (const category of CommandSub) {
				const commandFiles = fs
				.readdirSync(`./commands/${category}`)
				.filter((file) => file.endsWith(".js"));
				for (const file of commandFiles) {
					let commandPath = (`${CommandsDir}/${category}/${file}`).replace(/\\/g, '/');
					delete require.cache[require.resolve(commandPath)];
					const command = require(commandPath);
					if (!command || !command.run || !command.name) {
						return client.error(`Não foi possível carregar o comando: ${file} não possui um comando válido com função ou nome de execução`);
					}
					client.slash.set(command.name, command);
				}
			}
			
			const commandsSize = `Reloaded ${client.slash.size} Commands.`;
			client.info(commandsSize + `\nIn: ${interaction.member.guild.name} - ${interaction.member.guild.id}\nOn shard: ${interaction.member.guild.shardId}`);
			return interaction.reply({
				embeds: [new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(commandsSize)
					.setFooter({text: `${client.user.username} foi recarregado por ${interaction.user.username}`})
					.setTimestamp(),
				], 
				ephemeral: true
			});
		} catch (err) {
			client.error(err + `\nIn: ${interaction.member.guild.name} - ${interaction.member.guild.id}\n On shard: ${interaction.member.guild.shardId}`);
			console.log(err);
			return interaction.reply({ 
				embeds: [new EmbedBuilder().setColor("Red")
				.setDescription("OOPSIE, WOOPSIE!! Uwu Fizemos um maluco!! Um pouco de merda boingo! Os macacos do código em nossa sede estão trabalhando VEWY HAWD para consertar isso!")
				.setFooter({text: "Resumindo... não sei o que aconteceu... Mas você pode pedir a um desenvolvedor de bot para investigar :D"})], 
				ephemeral: true
			})
		}
	}
}