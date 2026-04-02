# LedgeAI

AI機能を活用した次世代の家計簿アプリケーション。

## 📁 ディレクトリ構成 (Architecture)

このプロジェクトは、Docker Composeを用いたマイクロサービスアーキテクチャ（複数の独立したシステムを組み合わせる仕組み）で構成されています。

- **`frontend/`**: 画面側（React + TypeScript + Vite）。ユーザーが直接操作するカレンダーや入力パネルがここにあります。
- **`backend_rails/`**: メインAPI（Ruby on Rails）。家計簿のデータ（Transaction）や登録したモノ（Item）などの保存・読み出しを担当します。
- **`backend_ai/`**: 分析・AI拡張用API（Python + FastAPI）。将来的なAI分析や高度な計算などはここに分離されています。
- **`docker-compose.yml`**: これらすべてとデータベース（MySQL）を繋いで、一発で立ち上げるための設計書です。

## 🚀 起動方法 (Getting Started)

Docker Desktopを開いた状態で、このフォルダ（プロジェクトのルートディレクトリ）で以下のコマンドを実行するだけで全てのサービスが立ち上がります。

```bash
# コンテナのビルドとバックグラウンド起動
docker compose up --build -d
```

### アクセスURL

コンテナ起動後は以下のURLにアクセスしてください。

- 📱 **Frontend (ユーザー画面)**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Rails API (メインサーバー)**: [http://localhost:3001](http://localhost:3001)
- 🤖 **FastAPI (AI・分析用API)**: [http://localhost:8000](http://localhost:8000) / (Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs))


## 💡 便利なコマンド集

### アプリを終了するとき
```bash
docker compose down
```

### データベースを完全にリセットしたいとき
※注意：これまでの登録データがすべて消去されます。
```bash
docker compose down -v
```

### Railsのマイグレーション（テーブル変更などを反映）を行いたいとき
```bash
docker compose exec rails_api bin/rails db:migrate
```
