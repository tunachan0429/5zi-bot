const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { addSchedule } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule-add')
    .setDescription('新しいスケジュールを追加します')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('スケジュール名（識別用）')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('cron')
        .setDescription('cron式 (例: "30 9 * * *" = 毎日9:30, "0 18 * * 1-5" = 平日18:00)')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('再生するボイスチャンネル')
        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('audio')
        .setDescription('再生する音声ファイル名 (audioフォルダ内のファイル)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const name = interaction.options.getString('name');
    const cronExpression = interaction.options.getString('cron');
    const channel = interaction.options.getChannel('channel');
    const audioFile = interaction.options.getString('audio');

    try {
      const schedule = addSchedule(
        {
          name,
          cronExpression,
          guildId: interaction.guildId,
          channelId: channel.id,
          audioFile,
        },
        client
      );

      await interaction.reply({
        embeds: [
          {
            title: '✅ スケジュールを追加しました',
            color: 0x00ff00,
            fields: [
              { name: '📝 名前', value: schedule.name, inline: true },
              { name: '⏰ cron式', value: `\`${schedule.cronExpression}\``, inline: true },
              { name: '🔊 チャンネル', value: `<#${schedule.channelId}>`, inline: true },
              { name: '🎵 音声ファイル', value: schedule.audioFile, inline: true },
              { name: '🆔 ID', value: `\`${schedule.id}\``, inline: false },
            ],
            footer: {
              text: 'cron式の例: "0 9 * * *" = 毎日9:00 | "30 12 * * 1-5" = 平日12:30',
            },
          },
        ],
        ephemeral: false,
      });
    } catch (error) {
      await interaction.reply({
        content: `❌ エラー: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
