require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { generateDependencyReport } = require('@discordjs/voice');
const { startAllSchedules } = require('./scheduler');
const fs = require('fs');
const path = require('path');

// 起動時に音声関連ライブラリの検出状況を表示（トラブル診断用）
console.log('===== 音声ライブラリ検出状況 =====');
console.log(generateDependencyReport());
console.log('==================================');

// Discordクライアントの作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// コマンドコレクション
client.commands = new Collection();

// コマンドファイルの読み込み
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(
  (file) => file.startsWith('schedule-') && file.endsWith('.js')
);

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

// Bot準備完了イベント
client.once(Events.ClientReady, (readyClient) => {
  console.log(`[Bot] ${readyClient.user.tag} としてログインしました`);
  console.log(`[Bot] ${readyClient.guilds.cache.size} サーバーに参加中`);

  // 保存済みスケジュールを全て起動
  startAllSchedules(client);
});

// インタラクション（スラッシュコマンド）ハンドラ
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`[Bot] コマンド実行エラー:`, error);
    const reply = {
      content: 'コマンドの実行中にエラーが発生しました。',
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('[Bot] 未処理のPromise拒否:', error);
});

// ログイン
async function main() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error('[Bot] エラー: DISCORD_TOKEN が設定されていません。.envファイルを確認してください。');
    process.exit(1);
  }

  // 暗号化ライブラリ(libsodium)を事前に初期化しておく（音声接続の安定化）
  try {
    const sodium = require('libsodium-wrappers');
    if (sodium && sodium.ready) {
      await sodium.ready;
      console.log('[Bot] 暗号化ライブラリ(libsodium)の初期化が完了しました');
    }
  } catch (e) {
    console.warn('[Bot] libsodiumの初期化をスキップしました（別の暗号化ライブラリを使用）:', e.message);
  }

  await client.login(token);
}

main();
