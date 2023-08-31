const { ChannelType, OverwriteType } = require("discord.js");
const { controlChannelMessage } = require("../../../util/embeds");
const { setDbControlChannel } = require("../../../util/controlChannel");

/**
 * @type {import("discord.js").PermissionResolvable}
 */
const CONTROL_CHANNEL_PERMISSIONS = [
	"ViewChannel",
	"SendMessages",
	"ManageMessages",
	"EmbedLinks",
	"AttachFiles",
	"ReadMessageHistory",
];

/**
 * @param {import("../../../lib/SlashCommand")} baseCommand
 */
module.exports = function controlChannel(baseCommand) {
	const commandName = "control-channel";

	baseCommand.addSubcommand((command) =>
		command
		.setName(commandName)
		.setDescription("Criar canal de controle do servidor")
		.addStringOption((opt) =>
			opt
			.setName("channel")
			.setDescription(
				"Crie um canal com este nome como canal de controle do servidor, deixe em branco para redefinir"
			)
			.setMaxLength(100)
		)
	);

	baseCommand.setSubCommandHandler(
		commandName,
		async function (client, interaction, options) {
			const channelName = options.getString("channel", false);

			const guildId = interaction.guild.id;

			await interaction.deferReply();

			if (!channelName?.length)
				try {
					await setDbControlChannel({guildId, channelId: null, messageId: null});

					return interaction.editReply("Reinicialização do canal de controle!");
				} catch (e) {
					client.error(
						"Erro ao remover a configuração do canal de controle na guilda:",
						guildId
					);
					client.error(e);

					return interaction.editReply("Erro ao atualizar a configuração");
				}

			try {
				// apenas deixe o discord validar a string, pois alguns unicode são nomes de canal válidos
				const createdChannel = await interaction.guild.channels.create({
					name: channelName,
					position: 0,
					reason: "Discord Music Bot Control Channel",
					topic: "Discord Music Bot Control Channel",
					type: ChannelType.GuildText,
					permissionOverwrites: CONTROL_CHANNEL_PERMISSIONS.map((perm) => ({
						allow: perm,
						id: interaction.guild.members.me.id,
						type: OverwriteType.Member,
					})),
				});

				// construir mensagem de controle
				const msg = controlChannelMessage({ guildId: interaction.guildId });

				const controlMessage = await createdChannel.send(msg);

				await controlMessage.pin("Discord Music Bot Control Message");

				const channelId = createdChannel.id;
				const messageId = controlMessage.id;

				await setDbControlChannel({guildId, channelId, messageId});

				return interaction.editReply(`Conjunto de canais de controle <#${channelId}>!`);
			} catch (e) {
				client.error(e);
				console.error(e);
				if (e.message?.length) return interaction.editReply(e.message);
			}
		}
	);

	baseCommand.setSubCommandBotPermissions(commandName, [
		{
			permission: "ManageChannels",
			message: "criando canal de controle",
		},
		...CONTROL_CHANNEL_PERMISSIONS.map((perm) => ({
			permission: perm,
			message: "gerenciamento de canal de controle",
		})),
	]);

	return baseCommand;
};
