# Discord Voice Schedule Bot

指定した時間にボイスチャンネルに参加し、音声ファイルを再生して退出するDiscord Botです。

## 機能

- cron式による柔軟な時間指定
- 複数スケジュールの登録・管理
- スラッシュコマンドによる操作
- スケジュールのJSON永続化（Bot再起動後も有効）

## 必要条件

- Node.js 18以上
- FFmpeg（音声再生に必要）
- Discord Bot Token

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. FFmpegのインストール

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
[FFmpeg公式サイト](https://ffmpeg.org/download.html) からダウンロードし、PATHに追加してください。

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、値を設定します。

```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=あなたのBotトークン
CLIENT_ID=あなたのアプリケーションID
GUILD_ID=開発用サーバーID（省略でグローバル登録）
```

### 4. Discord Developer Portal の設定

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリケーションを作成
2. Bot セクションで Bot Token を取得
3. OAuth2 > URL Generator で以下のスコープと権限を選択:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Connect`, `Speak`, `Use Voice Activity`
4. 生成されたURLでBotをサーバーに招待

### 5. 音声ファイルの配置

`audio/` ディレクトリに再生したい音声ファイルを配置します。

対応形式: mp3, wav, ogg, webm, flac など（FFmpegが対応する形式）

```
audio/
├── morning.mp3
├── alarm.wav
└── notification.ogg
```

### 6. スラッシュコマンドの登録

```bash
npm run deploy
```

### 7. Botの起動

```bash
npm start
```

## スラッシュコマンド

### `/schedule-add`
新しいスケジュールを追加します。

| オプション | 説明 | 例 |
|-----------|------|-----|
| `name` | スケジュール名 | 朝の挨拶 |
| `cron` | cron式 | `0 9 * * *` |
| `channel` | ボイスチャンネル | (選択式) |
| `audio` | 音声ファイル名 | morning.mp3 |

### `/schedule-remove`
スケジュールを削除します。

| オプション | 説明 |
|-----------|------|
| `id` | スケジュールID（/schedule-listで確認可能） |

### `/schedule-list`
登録されている全スケジュールの一覧を表示します。

## cron式の書き方

```
┌─── 分 (0-59)
│ ┌─── 時 (0-23)
│ │ ┌─── 日 (1-31)
│ │ │ ┌─── 月 (1-12)
│ │ │ │ ┌─── 曜日 (0-7, 0と7は日曜)
│ │ │ │ │
* * * * *
```

### よく使う例

| cron式 | 意味 |
|--------|------|
| `0 9 * * *` | 毎日 9:00 |
| `30 12 * * *` | 毎日 12:30 |
| `0 18 * * 1-5` | 平日 18:00 |
| `0 9,18 * * *` | 毎日 9:00 と 18:00 |
| `0 0 1 * *` | 毎月1日 0:00 |
| `*/30 * * * *` | 30分ごと |

## 注意事項

- Botにボイスチャンネルへの接続・発言権限が必要です
- 音声ファイルは事前に `audio/` ディレクトリに配置してください
- cron式のタイムゾーンはサーバーのシステム時刻に依存します
- `ManageGuild`（サーバー管理）権限を持つユーザーのみコマンドを使用できます

## トラブルシューティング

- **音声が再生されない**: FFmpegがインストールされているか確認してください
- **Botが接続できない**: Botの権限設定を確認してください
- **コマンドが表示されない**: `npm run deploy` を実行してください
