/**
 * @param {import("../../../lib/SlashCommand")} baseCommand
 */
module.exports = function djRole(baseCommand) {
	baseCommand.addSubcommand((command) =>
		command
		.setName("dj-role")
		.setDescription("Definir função de DJ do servidor")
		.addRoleOption((opt) =>
			opt
			.setName("role")
			.setDescription(
				"Defina esta função como função de DJ do servidor, deixe em branco para redefinir"
			)
		)
	);

	return baseCommand.setSubCommandHandler(
		"dj-role",
		async function (client, interaction, options) {
			const role = options.getRole("role", false);

			const guildId = interaction.guild.id;
			const roleId = role?.id || null;

			try {
				await client.db.guild.upsert({
					where: {
						guildId,
					},
					create: { DJRole: roleId, guildId },
					update: { DJRole: roleId },
				});
			} catch (e) {
				client.error(e);

				return interaction.reply("Erro ao atualizar a configuração");
			}

			const reply = !roleId ? "Função de DJ redefinida!" : "Conjunto de papéis de DJ!";

			return interaction.reply(reply);
		}
	);
};
