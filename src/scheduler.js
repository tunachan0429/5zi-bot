const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { playAudioInChannel } = require('./voice');

const SCHEDULES_PATH = path.resolve(__dirname, 'data', 'schedules.json');

// アクティブなcronジョブを管理するMap
const activeJobs = new Map();

/**
 * スケジュールデータの構造:
 * {
 *   id: string,          // UUID
 *   name: string,        // スケジュール名
 *   cronExpression: string, // cron式 (例: "0 9 * * *" = 毎日9:00)
 *   guildId: string,     // サーバーID
 *   channelId: string,   // ボイスチャンネルID
 *   audioFile: string,   // 音声ファイル名
 *   enabled: boolean,    // 有効/無効
 *   createdAt: string,   // 作成日時
 * }
 */

/**
 * スケジュール一覧をファイルから読み込む
 * @returns {Array} スケジュール配列
 */
function loadSchedules() {
  try {
    const data = fs.readFileSync(SCHEDULES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Scheduler] スケジュールファイルの読み込みに失敗:', error.message);
    return [];
  }
}

/**
 * スケジュール一覧をファイルに保存する
 * @param {Array} schedules - スケジュール配列
 */
function saveSchedules(schedules) {
  const dir = path.dirname(SCHEDULES_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SCHEDULES_PATH, JSON.stringify(schedules, null, 2), 'utf-8');
}

/**
 * 特定のギルドのスケジュール一覧を取得する
 * @param {string} guildId - サーバーID
 * @returns {Array} スケジュール配列
 */
function getSchedules(guildId) {
  const schedules = loadSchedules();
  return schedules.filter((s) => s.guildId === guildId);
}

/**
 * スケジュールを追加する
 * @param {object} params - スケジュールパラメータ
 * @param {import('discord.js').Client} client - Discordクライアント
 * @returns {object} 作成されたスケジュール
 */
function addSchedule(params, client) {
  const { name, cronExpression, guildId, channelId, audioFile } = params;

  // cron式のバリデーション
  if (!cron.validate(cronExpression)) {
    throw new Error(`無効なcron式です: ${cronExpression}`);
  }

  // 音声ファイルの存在確認
  const audioPath = path.resolve(__dirname, '..', 'audio', audioFile);
  if (!fs.existsSync(audioPath)) {
    throw new Error(`音声ファイルが見つかりません: ${audioFile}`);
  }

  const schedule = {
    id: uuidv4(),
    name,
    cronExpression,
    guildId,
    channelId,
    audioFile,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  const schedules = loadSchedules();
  schedules.push(schedule);
  saveSchedules(schedules);

  // cronジョブを登録
  registerJob(schedule, client);

  console.log(`[Scheduler] スケジュールを追加しました: ${name} (${cronExpression})`);
  return schedule;
}

/**
 * スケジュールを削除する
 * @param {string} scheduleId - スケジュールID
 * @param {string} guildId - サーバーID
 * @returns {boolean} 削除成功かどうか
 */
function removeSchedule(scheduleId, guildId) {
  const schedules = loadSchedules();
  const index = schedules.findIndex((s) => s.id === scheduleId && s.guildId === guildId);

  if (index === -1) {
    return false;
  }

  // cronジョブを停止
  const job = activeJobs.get(scheduleId);
  if (job) {
    job.stop();
    activeJobs.delete(scheduleId);
  }

  schedules.splice(index, 1);
  saveSchedules(schedules);

  console.log(`[Scheduler] スケジュールを削除しました: ${scheduleId}`);
  return true;
}

/**
 * 単一のスケジュールのcronジョブを登録する
 * @param {object} schedule - スケジュールオブジェクト
 * @param {import('discord.js').Client} client - Discordクライアント
 */
function registerJob(schedule, client) {
  if (!schedule.enabled) return;

  // 既存のジョブがあれば停止
  const existingJob = activeJobs.get(schedule.id);
  if (existingJob) {
    existingJob.stop();
  }

  const job = cron.schedule(schedule.cronExpression, async () => {
    console.log(`[Scheduler] スケジュール "${schedule.name}" が発火しました`);

    try {
      const guild = client.guilds.cache.get(schedule.guildId);
      if (!guild) {
        console.error(`[Scheduler] ギルドが見つかりません: ${schedule.guildId}`);
        return;
      }

      const channel = guild.channels.cache.get(schedule.channelId);
      if (!channel) {
        console.error(`[Scheduler] チャンネルが見つかりません: ${schedule.channelId}`);
        return;
      }

      if (!channel.isVoiceBased()) {
        console.error(`[Scheduler] 指定されたチャンネルはボイスチャンネルではありません: ${channel.name}`);
        return;
      }

      await playAudioInChannel(channel, schedule.audioFile);
    } catch (error) {
      console.error(`[Scheduler] スケジュール実行エラー:`, error);
    }
  }, {
    timezone: 'Asia/Tokyo',
  });

  activeJobs.set(schedule.id, job);
}

/**
 * 保存済みの全スケジュールのcronジョブを起動する
 * @param {import('discord.js').Client} client - Discordクライアント
 */
function startAllSchedules(client) {
  const schedules = loadSchedules();
  let count = 0;

  for (const schedule of schedules) {
    if (schedule.enabled) {
      registerJob(schedule, client);
      count++;
    }
  }

  console.log(`[Scheduler] ${count}件のスケジュールを起動しました`);
}

/**
 * 全てのcronジョブを停止する
 */
function stopAllSchedules() {
  for (const [id, job] of activeJobs) {
    job.stop();
  }
  activeJobs.clear();
  console.log('[Scheduler] 全スケジュールを停止しました');
}

module.exports = {
  loadSchedules,
  getSchedules,
  addSchedule,
  removeSchedule,
  startAllSchedules,
  stopAllSchedules,
};
