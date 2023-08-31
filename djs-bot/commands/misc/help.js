const { EmbedBuilder,ComponentType, ActionRowBuilder, StringSelectMenuBuilder, Message } = require("discord.js");
const { capitalize } = require("../../util/string");
const SlashCommand = require("../../lib/SlashCommand");
const { getClient } = require("../../bot");

/** @type {SlashCommand} */
module.exports = {
	name: "help",
	usage: '/help <command?>',
	options: [
		{
			type: 3, // "STRING"
			name: 'command',
			description: 'Qual comando você deseja exibir',
			required: false,
			autocomplete: true,
		}
	],
	autocompleteOptions: () => getClient().slash.map(cmd => {
		return { name: cmd.name, value: cmd.name }
	}),
	category: "misc",
	description: "Retorne todos os comandos, ou um comando específico!",
	ownerOnly: false,
	run: async (client, interaction) => {
		const commandArg = interaction.options.getString("command");

		let gitHash = "";
		try {
			gitHash = require("child_process")
				.execSync("git rev-parse --short HEAD")
				.toString()
				.trim();
		} catch (e) {
			gitHash = "unknown";
		}

		if (commandArg && !client.slash.has(commandArg)) {
			return interaction.reply({
				embeds: [new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setTitle("Tem certeza de que escreveu isso corretamente?")
					.setDescription("Nenhum comando com esse nome existe\nUse '/help' para obter uma lista completa dos comandos")],
				ephemeral: true
			})
		} else if (client.slash.has(commandArg)) {
			return interaction.reply({
				embeds: [new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setTitle(commandArg)
					.setDescription(`${(client.slash.get(commandArg).ownerOnly ? "**(Apenas proprietário)**" : "")}\n**Descrição:**\n${client.slash.get(commandArg).description}\n${(client.slash.get(commandArg).usage ? "**Uso:**\n" + client.slash.get(commandArg).usage : "")}`)
					.setFooter({ text: "Para obter uma lista mais completa dos comandos disponíveis, use '/help' sem argumentos." })]
			})
		}

		//await interaction.deferReply().catch((_) => {});

		let initialEmbed = new EmbedBuilder()
			.setTitle("Comandos Slash")
			.setDescription("Aqui está uma lista básica de todos os comandos para se orientar sobre as funcionalidades do bot:")
			.setColor(client.config.embedColor);
		let helpMenuActionRow = new ActionRowBuilder();
		let helpSelectMenu = new StringSelectMenuBuilder()
			.setCustomId("helpSelectMenu")
			.setPlaceholder("Nenhuma categoria selecionada")
			.addOptions([{ label: "Commands Overview", value: "overview" }]);

		const categories = client.slash.reduce((prev, val) => {
			const foundCategory = prev.find(v=>v.category===val.category);
			const categoryObject = foundCategory || { category: val.category, commands: [], };

			categoryObject.commands.push({
				commandName: val.name, 
				fileObject: val,
			});

			if (!foundCategory) return [...prev, categoryObject];

			return prev;
		}, []);

		for (const dir of categories) {
			const category = categories.find(selected => selected.category === dir.category);
			const categoryName = dir.category;
			if (category.commands.length) {
				initialEmbed.addField(capitalize(categoryName), category.commands.map(cmd => cmd.fileObject.ownerOnly ? null : `\`${cmd.commandName}\``).filter(Boolean).join(", "));
				helpSelectMenu.addOptions([
					{
						label: `${capitalize(categoryName)} commands`,
						value: categoryName
					}
				]);
			}
		}
		helpMenuActionRow.addComponents(helpSelectMenu);

		initialEmbed.addField(
			"Credits",
			`Discord Music Bot Version: v${require("../../package.json").version
			}; Build: ${gitHash}` +
			"\n" +
			`[✨ Support Server](https://discord.gg/sbySMS7m3v) | [Issues](https://github.com/SudhanPlayz/Discord-MusicBot/issues) | [Source](https://github.com/SudhanPlayz/Discord-MusicBot/tree/v5) | [Invite Me](https://discord.com/oauth2/authorize?client_id=${client.config.clientId}&permissions=${client.config.permissions}&scope=${client.config.scopes.toString().replace(/,/g, '%20')})`,
		);

		// quando adiar está ativo, isso precisa editar a resposta anterior
		/**
		 * @type {Message}
		 */
		const menuSelectEmbed = await interaction.reply({ embeds: [initialEmbed], components: [helpMenuActionRow] });
		const collector = menuSelectEmbed.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
		let buttonCollector;
		let currentPage = 0;

		collector.on("collect", async (collectedInteraction) => {
			const category = collectedInteraction.values[0];
			let helpCategoryEmbed = new EmbedBuilder();
			if (category === "overview") {
				helpCategoryEmbed = initialEmbed;
				await collectedInteraction.update({ embeds: [helpCategoryEmbed], components: [helpMenuActionRow] });
			} else {
				const commandFiles = client.slash.filter(slash => slash.category === category).map(slash => slash);

				if (!commandFiles.length) {
					await collectedInteraction.update({
						embeds: [new EmbedBuilder()
							.setDescription(`Nenhum comando encontrado para categoria ${category}...
					Selecione outra coisa.`)]
					});
				} else if (commandFiles.length > 25) {
					const maxPages = Math.ceil(commandFiles.length / 25);

					helpCategoryEmbed = new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setTitle(`${capitalize(category)} Comandos`)
						.setFooter({text: `Página ${currentPage + 1} de ${maxPages}`});
					let commandFilesPerPage = commandFiles.slice(currentPage * 25, (currentPage + 1) * 25);
					/** @type {Array<{name: string, value: string}>} */
					let fieldsPerPage = [];
					
					for (let command of commandFilesPerPage) {
						/** @type {SlashCommand} */
						const slashCommand = command;
						if (!slashCommand.ownerOnly)
							fieldsPerPage.push({ name: `${command.name}`, value: slashCommand.description });
					}
					helpCategoryEmbed.addFields(fieldsPerPage);

					const helpCategoryMessage = await collectedInteraction.update({ embeds: [helpCategoryEmbed], components: [ helpMenuActionRow, helpCategoryEmbed.getButtons(currentPage, maxPages)] });

					if (!buttonCollector) {
						buttonCollector = helpCategoryMessage.createMessageComponentCollector({ componentType: ComponentType.Button });

						buttonCollector.on("collect", async (button) => {
							if (button.customId === "previous_page") {
								currentPage--;
							} else if (button.customId === "next_page") {
								currentPage++;
							}

							helpCategoryEmbed = new EmbedBuilder()
								.setColor(client.config.embedColor)
								.setTitle(`${capitalize(category)} Comandos`)
								.setFooter({ text: `Página ${currentPage + 1} de ${maxPages}` });

							commandFilesPerPage = commandFiles.slice(currentPage * 25, (currentPage + 1) * 25);
							fieldsPerPage = [];
							for (let command of commandFilesPerPage) {
								/** @type {SlashCommand} */
								const slashCommand = command;
								if (!slashCommand.ownerOnly)
									fieldsPerPage.push({ name: `${command.name}`, value: slashCommand.description });
							}
							helpCategoryEmbed.addFields(fieldsPerPage);

							await button.update({ embeds: [helpCategoryEmbed], components: [helpMenuActionRow, helpCategoryEmbed.getButtons(currentPage, maxPages)] });
						});
					}
				} else {
					helpCategoryEmbed
						.setColor(client.config.embedColor)
						.setTitle(`${capitalize(category)} Comandos`);

					for (let command of commandFiles) {
						/** @type {SlashCommand} */
						const slashCommand = command;
						if (!slashCommand.ownerOnly)
							helpCategoryEmbed.addField(`${command.name}`, slashCommand.description);
					}
					await collectedInteraction.update({ embeds: [helpCategoryEmbed], components: [helpMenuActionRow] });
				}
			}
		});
	}
};
