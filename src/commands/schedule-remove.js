const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { removeSchedule, getSchedules } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule-remove')
    .setDescription('スケジュールを削除します')
    .addStringOption((option) =>
      option
        .setName('id')
        .setDescription('削除するスケジュールのID（/schedule-list で確認可能）')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const scheduleId = interaction.options.getString('id');

    const success = removeSchedule(scheduleId, interaction.guildId);

    if (success) {
      await interaction.reply({
        embeds: [
          {
            title: '🗑️ スケジュールを削除しました',
            description: `ID: \`${scheduleId}\``,
            color: 0xff6600,
          },
        ],
        ephemeral: false,
      });
    } else {
      await interaction.reply({
        content: '❌ 指定されたIDのスケジュールが見つかりません。`/schedule-list` でIDを確認してください。',
        ephemeral: true,
      });
    }
  },
};
