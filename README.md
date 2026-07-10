# Discord Voice Schedule Bot

指定した時間にボイスチャンネルに参加し、音声ファイルを再生して退出するDiscord Botです。

## かんたん起動（Windows）

`start.bat` をダブルクリックするだけで起動できます。

- 初回は自動で `npm install` を実行します
- `.env` が無ければテンプレートから作成し、メモ帳で開きます（トークンを入力して保存）
- スラッシュコマンドの登録も選べます

事前に必要なのは [Node.js](https://nodejs.org/) のインストールだけです。
FFmpeg は同梱（`ffmpeg-static`）、音声ライブラリもビルド不要（`opusscript`）なので、
Visual Studio や FFmpeg を別途インストールする必要はありません。

## 機能

- cron式による柔軟な時間指定
- 複数スケジュールの登録・管理
- スラッシュコマンドによる操作
- スケジュールのJSON永続化（Bot再起動後も有効）

## 必要条件

- Node.js 18以上
- Discord Bot Token

> FFmpeg は `ffmpeg-static` として自動的に同梱されるため、別途インストール不要です。
> 音声エンコードも `opusscript`（ピュアJavaScript）を使うため、C++ビルドツール（Visual Studio）は不要です。

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、値を設定します。

```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=あなたのBotトークン
CLIENT_ID=あなたのアプリケーションID
GUILD_ID=開発用サーバーID（省略でグローバル登録）
```

### 3. Discord Developer Portal の設定

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリケーションを作成
2. Bot セクションで Bot Token を取得
3. OAuth2 > URL Generator で以下のスコープと権限を選択:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Connect`, `Speak`, `Use Voice Activity`
4. 生成されたURLでBotをサーバーに招待

### 4. 音声ファイルの配置

`audio/` ディレクトリに再生したい音声ファイルを配置します。

対応形式: mp3, wav, ogg, webm, flac など（FFmpegが対応する形式）

```
audio/
├── morning.mp3
├── alarm.wav
└── notification.ogg
```

### 5. スラッシュコマンドの登録

```bash
npm run deploy
```

### 6. Botの起動

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

- **音声が再生されない**: 音声ファイルが `audio/` フォルダにあるか、ファイル名が正しいか確認してください
- **`npm install` で opus のビルドエラーが出る**: 最新版はビルド不要の `opusscript` を使用します。古い `node_modules` が残っている場合は、フォルダごと削除してから再度 `npm install` してください
- **Botが接続できない**: Botの権限（Connect / Speak）設定を確認してください
- **コマンドが表示されない**: `npm run deploy` を実行してください
