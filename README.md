# LedgeAI

AI機能を活用した次世代の家計簿アプリケーション。支出管理・収支分析に加え、ローカルLLMによる家計相談チャット機能を搭載しています。

## 📁 ディレクトリ構成 (Architecture)

このプロジェクトは、Docker Composeを用いたマイクロサービスアーキテクチャで構成されています。

- **`frontend/`**: 画面側（React + TypeScript + Vite）。カレンダー入力・管理・分析・AIチャットの4画面。
- **`backend_rails/`**: メインAPI（Ruby on Rails）。取引データ（Transaction）やカテゴリ（Item）の保存・取得を担当。
- **`backend_ai/`**: AI拡張用API（Python + FastAPI）。Prophet による支出予測と、Ollama を通じたローカルLLMチャットを担当。
- **`docker-compose.yml`**: 上記サービスとデータベース（MySQL）を一括起動するための設計書。

```
Mac ホスト
  Ollama (port 11434) ← Apple Silicon GPU を使用
      ↑ host.docker.internal:11434
  Docker
    ├─ React (frontend)     :5173
    ├─ Rails API            :3001  ←→ MySQL :3306
    └─ FastAPI (AI)         :8000
```

## 🚀 起動方法 (Getting Started)

### 前提条件

- Docker Desktop がインストールされていること
- **Ollama がインストールされていること**（初回のみ）

### Step 1: Ollama のインストール（初回のみ）

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: AIモデルのダウンロード（初回のみ）

```bash
# Qwen3.5 9B をダウンロード（約6.6GB）
ollama pull qwen3.5:9b
```

> ⏱ 回線速度によって5〜15分かかります。

### Step 3: Ollama を起動する

```bash
ollama serve
```

> 💡 Ollama はインストール時に自動起動されることが多いです。
> `address already in use` エラーが出た場合は**すでに起動中**なので無視してOKです。

### Step 4: アプリを起動する

Docker Desktop を開いた状態で、プロジェクトのルートフォルダで実行：

```bash
docker compose up --build
```

---

### アクセスURL

コンテナ起動後は以下のURLにアクセスしてください。

| サービス | URL |
|---------|-----|
| 📱 Frontend（ユーザー画面） | http://localhost:5173 |
| ⚙️ Rails API | http://localhost:3001 |
| 🤖 FastAPI（AI・分析） | http://localhost:8000 |
| 📄 FastAPI Swagger UI | http://localhost:8000/docs |

---

## 💬 AIチャット機能について

「💬 相談」タブから家計データを元にしたAIアドバイスを受けられます。

- **使用モデル**: Qwen3.5 9B（ローカル動作・プライバシー安全）
- **動作場所**: Mac ホスト上の Ollama（Apple Silicon GPU 使用）
- **データ連携**: 登録済みの家計データを自動でコンテキストに含めて質問できます

### Ollamaの状態確認

```bash
# 起動確認
ollama list

# 手動起動（自動起動されていない場合）
ollama serve

# モデルの削除（不要になった場合）
ollama rm qwen3.5:9b
```

---

## 💡 便利なコマンド集

### アプリを終了するとき
```bash
docker compose down
```

### バックグラウンドで起動したいとき
```bash
docker compose up --build -d
```

### データベースを完全にリセットしたいとき
> ⚠️ 注意：これまでの登録データがすべて消去されます。
```bash
docker compose down -v
```

### Railsのマイグレーション（テーブル変更を反映）を行いたいとき
```bash
docker compose exec backend_rails bin/rails db:migrate
```
