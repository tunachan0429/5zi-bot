/**
 * スケジューラモジュールのテスト
 */
const fs = require('fs');
const path = require('path');

// テスト用のスケジュールデータパスを差し替え
const SCHEDULES_PATH = path.resolve(__dirname, 'test-schedules.json');

// テスト前にファイルを初期化
function resetScheduleFile() {
  fs.writeFileSync(SCHEDULES_PATH, '[]', 'utf-8');
}

// テスト後にファイルを削除
function cleanup() {
  try {
    fs.unlinkSync(SCHEDULES_PATH);
  } catch (e) {}
}

// モジュール読み込み前にパスを書き換え
// scheduler.js 内の SCHEDULES_PATH をテスト用に上書きするため直接テスト

const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

// --- 単体テスト ---

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

console.log('=== Discord Voice Bot テスト ===\n');

// テスト1: cron式バリデーション
console.log('📋 テスト1: cron式バリデーション');
assert(cron.validate('0 9 * * *') === true, '毎日9:00 は有効なcron式');
assert(cron.validate('30 12 * * 1-5') === true, '平日12:30 は有効なcron式');
assert(cron.validate('*/30 * * * *') === true, '30分ごと は有効なcron式');
assert(cron.validate('0 9,18 * * *') === true, '毎日9:00と18:00 は有効なcron式');
assert(cron.validate('invalid') === false, '"invalid" は無効なcron式');
assert(cron.validate('60 25 * * *') === false, '60分25時 は無効なcron式');
assert(cron.validate('') === false, '空文字 は無効なcron式');
console.log('');

// テスト2: UUID生成
console.log('📋 テスト2: UUID生成');
const id1 = uuidv4();
const id2 = uuidv4();
assert(typeof id1 === 'string', 'UUIDは文字列');
assert(id1.length === 36, 'UUIDの長さは36文字');
assert(id1 !== id2, '生成されるUUIDはユニーク');
assert(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id1), 'UUID v4形式に一致');
console.log('');

// テスト3: スケジュールJSONの読み書き
console.log('📋 テスト3: スケジュールJSONの読み書き');
resetScheduleFile();
const testSchedule = {
  id: uuidv4(),
  name: 'テスト朝の挨拶',
  cronExpression: '0 9 * * *',
  guildId: '123456789',
  channelId: '987654321',
  audioFile: 'test.mp3',
  enabled: true,
  createdAt: new Date().toISOString(),
};

// 書き込みテスト
const schedules = [testSchedule];
fs.writeFileSync(SCHEDULES_PATH, JSON.stringify(schedules, null, 2), 'utf-8');
assert(fs.existsSync(SCHEDULES_PATH), 'スケジュールファイルが作成された');

// 読み込みテスト
const loaded = JSON.parse(fs.readFileSync(SCHEDULES_PATH, 'utf-8'));
assert(loaded.length === 1, '1件のスケジュールが保存されている');
assert(loaded[0].name === 'テスト朝の挨拶', '名前が正しく保存されている');
assert(loaded[0].cronExpression === '0 9 * * *', 'cron式が正しく保存されている');
assert(loaded[0].guildId === '123456789', 'ギルドIDが正しく保存されている');
assert(loaded[0].channelId === '987654321', 'チャンネルIDが正しく保存されている');
assert(loaded[0].audioFile === 'test.mp3', '音声ファイル名が正しく保存されている');
assert(loaded[0].enabled === true, '有効フラグが正しく保存されている');

// 複数追加テスト
const testSchedule2 = {
  id: uuidv4(),
  name: 'テスト夕方通知',
  cronExpression: '0 18 * * 1-5',
  guildId: '123456789',
  channelId: '111222333',
  audioFile: 'evening.mp3',
  enabled: true,
  createdAt: new Date().toISOString(),
};
schedules.push(testSchedule2);
fs.writeFileSync(SCHEDULES_PATH, JSON.stringify(schedules, null, 2), 'utf-8');
const loaded2 = JSON.parse(fs.readFileSync(SCHEDULES_PATH, 'utf-8'));
assert(loaded2.length === 2, '2件のスケジュールが保存されている');

// 削除テスト
const filtered = loaded2.filter(s => s.id !== testSchedule.id);
fs.writeFileSync(SCHEDULES_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
const loaded3 = JSON.parse(fs.readFileSync(SCHEDULES_PATH, 'utf-8'));
assert(loaded3.length === 1, '削除後は1件のスケジュール');
assert(loaded3[0].name === 'テスト夕方通知', '残っているのは2つ目のスケジュール');

// ギルドフィルタテスト
const testSchedule3 = {
  id: uuidv4(),
  name: '別サーバーの通知',
  cronExpression: '0 12 * * *',
  guildId: '999888777',
  channelId: '444555666',
  audioFile: 'noon.mp3',
  enabled: true,
  createdAt: new Date().toISOString(),
};
filtered.push(testSchedule3);
fs.writeFileSync(SCHEDULES_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
const loaded4 = JSON.parse(fs.readFileSync(SCHEDULES_PATH, 'utf-8'));
const guildFiltered = loaded4.filter(s => s.guildId === '123456789');
assert(guildFiltered.length === 1, 'ギルドIDでフィルタすると1件');
assert(loaded4.length === 2, '全体では2件');
console.log('');

// テスト4: cronジョブのタイムゾーン設定
console.log('📋 テスト4: cronジョブのタイムゾーン（Asia/Tokyo）');
let cronFired = false;
// 毎秒実行のcronで即座にテスト
const testJob = cron.schedule('* * * * * *', () => {
  cronFired = true;
}, {
  timezone: 'Asia/Tokyo',
  scheduled: false,
});
assert(testJob !== null, 'タイムゾーン付きcronジョブが作成できる');
testJob.stop();
console.log('');

// テスト5: voice.js のモジュール構造
console.log('📋 テスト5: モジュールの読み込み');
const voice = require('../src/voice');
assert(typeof voice.playAudioInChannel === 'function', 'playAudioInChannel がexportされている');

const scheduler = require('../src/scheduler');
assert(typeof scheduler.loadSchedules === 'function', 'loadSchedules がexportされている');
assert(typeof scheduler.getSchedules === 'function', 'getSchedules がexportされている');
assert(typeof scheduler.addSchedule === 'function', 'addSchedule がexportされている');
assert(typeof scheduler.removeSchedule === 'function', 'removeSchedule がexportされている');
assert(typeof scheduler.startAllSchedules === 'function', 'startAllSchedules がexportされている');
assert(typeof scheduler.stopAllSchedules === 'function', 'stopAllSchedules がexportされている');
console.log('');

// テスト6: 音声ファイルパスの解決
console.log('📋 テスト6: 音声ファイルパスの解決');
const audioDir = path.resolve(__dirname, '..', 'audio');
assert(fs.existsSync(audioDir), 'audioディレクトリが存在する');
// テスト用音声ファイルを作成
const testAudioPath = path.join(audioDir, 'test-sound.mp3');
fs.writeFileSync(testAudioPath, 'fake audio data for testing');
assert(fs.existsSync(testAudioPath), 'テスト用音声ファイルが作成された');
// クリーンアップ
fs.unlinkSync(testAudioPath);
console.log('');

// クリーンアップ
cleanup();

// 結果サマリー
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`結果: ${passed} passed / ${failed} failed / ${passed + failed} total`);
if (failed > 0) {
  console.log('❌ テスト失敗があります');
  process.exit(1);
} else {
  console.log('✅ 全テスト合格！');
}
