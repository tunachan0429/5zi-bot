/**
 * スラッシュコマンドをDiscordに登録するスクリプト
 * 使い方: npm run deploy
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('エラー: DISCORD_TOKEN と CLIENT_ID を .env に設定してください。');
  process.exit(1);
}

// コマンドファイルを読み込み
const commands = [];
const commandsPath = __dirname;
const commandFiles = fs.readdirSync(commandsPath).filter(
  (file) => file.startsWith('schedule-') && file.endsWith('.js')
);

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command) {
    commands.push(command.data.toJSON());
    console.log(`[Deploy] コマンドを読み込みました: /${command.data.name}`);
  }
}

// コマンドを登録
const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`[Deploy] ${commands.length}件のコマンドを登録中...`);

    let data;
    if (guildId) {
      // ギルドコマンド（即時反映、開発用）
      data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log(`[Deploy] ギルド (${guildId}) に ${data.length}件のコマンドを登録しました`);
    } else {
      // グローバルコマンド（反映まで最大1時間）
      data = await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
      console.log(`[Deploy] グローバルに ${data.length}件のコマンドを登録しました（反映まで最大1時間）`);
    }
  } catch (error) {
    console.error('[Deploy] コマンド登録エラー:', error);
    process.exit(1);
  }
})();
