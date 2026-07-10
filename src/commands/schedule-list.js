const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getSchedules } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule-list')
    .setDescription('登録されているスケジュール一覧を表示します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const schedules = getSchedules(interaction.guildId);

    if (schedules.length === 0) {
      await interaction.reply({
        embeds: [
          {
            title: '📋 スケジュール一覧',
            description: 'スケジュールが登録されていません。\n`/schedule-add` で新しいスケジュールを追加してください。',
            color: 0x808080,
          },
        ],
        ephemeral: true,
      });
      return;
    }

    const fields = schedules.map((s, i) => ({
      name: `${i + 1}. ${s.name}`,
      value: [
        `⏰ cron: \`${s.cronExpression}\``,
        `🔊 チャンネル: <#${s.channelId}>`,
        `🎵 音声: ${s.audioFile}`,
        `🆔 ID: \`${s.id}\``,
        `📅 作成日: ${new Date(s.createdAt).toLocaleString('ja-JP')}`,
      ].join('\n'),
      inline: false,
    }));

    await interaction.reply({
      embeds: [
        {
          title: '📋 スケジュール一覧',
          description: `${schedules.length}件のスケジュールが登録されています`,
          color: 0x0099ff,
          fields,
          footer: {
            text: '削除するには /schedule-remove <ID> を使用してください',
          },
        },
      ],
      ephemeral: true,
    });
  },
};
