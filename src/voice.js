// 同梱のFFmpegバイナリを使う（システムへのFFmpegインストールを不要にする）
const ffmpegStatic = require('ffmpeg-static');
if (ffmpegStatic) {
  process.env.FFMPEG_PATH = ffmpegStatic;
}

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

/**
 * ボイスチャンネルに接続し、音声ファイルを再生して退出する
 * @param {import('discord.js').VoiceChannel} channel - 接続先のボイスチャンネル
 * @param {string} audioFile - 再生する音声ファイル名（audioディレクトリ内）
 * @returns {Promise<void>}
 */
async function playAudioInChannel(channel, audioFile) {
  const audioPath = path.resolve(__dirname, '..', 'audio', audioFile);

  // 音声ファイルの存在確認
  if (!fs.existsSync(audioPath)) {
    console.error(`[Voice] 音声ファイルが見つかりません: ${audioPath}`);
    return;
  }

  console.log(`[Voice] チャンネル "${channel.name}" に接続中...`);

  // ボイスチャンネルに接続
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  // 接続状態の変化をログ出力（どこで止まるかを診断するため）
  connection.on('stateChange', (oldState, newState) => {
    console.log(`[Voice] 接続状態: ${oldState.status} -> ${newState.status}`);
  });

  try {
    // 接続が確立されるまで待機（最大30秒）
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log(`[Voice] チャンネル "${channel.name}" に接続しました`);

    // オーディオプレイヤーを作成
    const player = createAudioPlayer();

    // オーディオリソースを作成
    const resource = createAudioResource(audioPath);

    // プレイヤーをコネクションに登録
    connection.subscribe(player);

    // 再生開始
    player.play(resource);
    console.log(`[Voice] "${audioFile}" を再生中...`);

    // 再生完了まで待機
    await new Promise((resolve, reject) => {
      player.on(AudioPlayerStatus.Idle, () => {
        console.log(`[Voice] "${audioFile}" の再生が完了しました`);
        resolve();
      });

      player.on('error', (error) => {
        console.error(`[Voice] 再生エラー:`, error);
        reject(error);
      });
    });
  } catch (error) {
    if (error && (error.code === 'ABORT_ERR' || error.name === 'AbortError')) {
      console.error('[Voice] 30秒以内にVCへ接続できませんでした（タイムアウト）。');
      console.error('        考えられる原因:');
      console.error('        1) 暗号化ライブラリ(libsodium-wrappers)が検出されていない');
      console.error('        2) ファイアウォール/アンチウイルスがUDP通信をブロックしている');
      console.error('        3) BotにVCへの接続(Connect)権限が無い');
    } else {
      console.error('[Voice] エラーが発生しました:', error);
    }
  } finally {
    // 接続を切断
    connection.destroy();
    console.log(`[Voice] チャンネル "${channel.name}" から退出しました`);
  }
}

module.exports = { playAudioInChannel };
