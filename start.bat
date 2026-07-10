@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   Discord Voice Schedule Bot 起動スクリプト
echo ============================================
echo.

REM --- Node.js のインストール確認 ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [エラー] Node.js が見つかりません。
    echo https://nodejs.org/ から Node.js をインストールしてください。
    echo.
    pause
    exit /b 1
)

REM --- .env ファイルの確認 ---
if not exist ".env" (
    echo [警告] .env ファイルが見つかりません。
    if exist ".env.example" (
        echo .env.example をコピーして .env を作成します...
        copy ".env.example" ".env" >nul
        echo.
        echo [重要] .env を開いて DISCORD_TOKEN などを設定してから
        echo         もう一度このファイルを実行してください。
        echo.
        notepad ".env"
        pause
        exit /b 1
    ) else (
        echo [エラー] .env.example もありません。セットアップを確認してください。
        pause
        exit /b 1
    )
)

REM --- 依存パッケージのインストール確認 ---
if not exist "node_modules" (
    echo 初回起動のため、依存パッケージをインストールします...
    echo （少し時間がかかります）
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [エラー] npm install に失敗しました。
        pause
        exit /b 1
    )
    echo.
)

REM --- スラッシュコマンドの登録 ---
echo スラッシュコマンドを登録しますか？ (初回や、コマンドを変更した時のみ必要)
choice /c YN /n /m "登録する場合は Y、スキップする場合は N を押してください [Y/N]: "
if %errorlevel%==1 (
    echo コマンドを登録中...
    call npm run deploy
    echo.
)

REM --- Bot の起動 ---
echo Bot を起動します... (停止するには Ctrl + C)
echo ============================================
echo.
call npm start

pause
