const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const fs = require("fs");
const path = require("path");
const { forEach } = require("lodash");

const command = new SlashCommand()
	.setName("guildleave")
	.setDescription("deixa uma guilda")
    .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("Digite o id da guilda para deixar (digite 'list' para ids da guilda)")
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
		if (interaction.user.id === client.config.adminId) {
		    try{
			const id = interaction.options.getString('id');

			if (id.toLowerCase() === 'list'){
			    client.guilds.cache.forEach((guild) => {
				console.log(`${guild.name} | ${guild.id}`);
			    });
			    const guild = client.guilds.cache.map(guild => ` ${guild.name} | ${guild.id}`);
			    try{
				return interaction.reply({content:`Guildas:\n\`${guild}\``, ephemeral: true});
			    }catch{
				return interaction.reply({content:`Verifique o console para obter a lista de guildas`, ephemeral: true});
			    }
			}

			const guild = client.guilds.cache.get(id);

			if(!guild){
			    return interaction.reply({content: `\`${id}\` não é um id de guilda válido`, ephemeral:true});
			}

			await guild.leave().then(c => console.log(`left guild ${id}`)).catch((err) => {console.log(err)});
			return interaction.reply({content:`left guild \`${id}\``, ephemeral: true});
		    }catch (error){
			console.log(`houve um erro ao tentar sair da guilda ${id}`, error);
		    }
		}else {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription("Você não está autorizado a usar este comando!"),
				],
				ephemeral: true,
			});
		}
	});

module.exports = command;
