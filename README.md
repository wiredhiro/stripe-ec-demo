# EC Demo Shop - Stripe決済連携デモ

Stripe Checkoutを使用したEC決済フローのデモアプリケーションです。

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Node.js + Express + TypeScript
- **決済**: Stripe Checkout (テストモード) または デモモード（擬似決済）

## 動作モード

このアプリは2つのモードで動作します:

| モード | 説明 | 用途 |
|--------|------|------|
| **デモモード** | Stripe APIを使用せず、擬似的な決済フローを再現 | ポートフォリオ公開、デモンストレーション |
| **Stripeモード** | 実際のStripe Checkout APIを使用 | 開発・テスト、本番運用 |

## クイックスタート（デモモード）

**Stripeアカウント不要**で、すぐに決済フローを体験できます。

```bash
# サーバーセットアップ
cd server
npm install
npm run dev
# → "Running in DEMO MODE" と表示されれば成功

# クライアントセットアップ（別ターミナル）
cd client
npm install
npm run dev
```

- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:3001

デモモードでは:
- 商品をカートに追加 → 「レジに進む」
- 擬似決済ページで任意のカード情報を入力（検証なし）
- 「支払う」ボタンで決済成功画面へ

## Stripeモードで使用する場合

### 1. Stripeアカウントの準備

1. [Stripe](https://stripe.com/jp)でアカウントを作成（無料）
2. ダッシュボードで「テストモード」に切り替え
3. [APIキー](https://dashboard.stripe.com/test/apikeys)ページから以下を取得:
   - シークレットキー (`sk_test_...`)

### 2. バックエンドのセットアップ

```bash
cd server
cp .env.example .env
```

`.env`ファイルを編集:
```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
CLIENT_URL=http://localhost:5173
PORT=3001
```

```bash
npm install
npm run dev
```

### 3. フロントエンドのセットアップ

```bash
cd client
npm install
npm run dev
```

### テスト用カード情報（Stripeモードのみ）

> **注意**: デモモードでは任意のカード番号で決済が完了します。以下はStripeモード使用時のみ必要です。

Stripeテストモードでは以下のカード番号が使用できます:

| カード種別 | カード番号 | 結果 |
|-----------|-----------|------|
| Visa | 4242 4242 4242 4242 | 成功 |
| Mastercard | 5555 5555 5555 4444 | 成功 |
| 拒否 | 4000 0000 0000 0002 | 失敗 |

- 有効期限: 未来の日付（例: 12/34）
- CVC: 任意の3桁（例: 123）

## 機能一覧

- 商品一覧表示
- カート機能（追加/削除/数量変更）
- Stripe Checkout による決済（または擬似決済）
- 決済成功/キャンセル画面

## セキュリティ対策

本番公開向けに以下のセキュリティ対策を実装済み:

- **helmet**: セキュリティヘッダー（XSS、クリックジャッキング対策など）
- **express-rate-limit**: レート制限（DoS対策）
- **zod**: 入力バリデーション
- **CORS設定**: オリジン制限
- **エラーハンドリング**: 本番環境でのスタックトレース非表示

## プロジェクト構造

```
stripe-ec-demo/
├── client/                 # フロントエンド
│   ├── src/
│   │   ├── components/    # 共通コンポーネント
│   │   ├── context/       # React Context (カート状態)
│   │   ├── pages/         # ページコンポーネント
│   │   │   ├── ProductList.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── DemoCheckout.tsx  # デモモード用決済画面
│   │   │   ├── Success.tsx
│   │   │   └── Cancel.tsx
│   │   └── types/         # TypeScript型定義
│   └── ...
├── server/                 # バックエンド
│   ├── src/
│   │   └── index.ts       # Express サーバー
│   └── ...
└── README.md
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/config | サーバー設定（デモモード判定） |
| GET | /api/products | 商品一覧取得 |
| GET | /api/products/:id | 商品詳細取得 |
| POST | /api/create-checkout-session | 決済セッション作成 |
| GET | /api/checkout-session/:sessionId | 決済セッション情報取得 |
| GET | /api/demo-session/:sessionId | デモセッション情報取得 |
| POST | /api/demo-complete/:sessionId | デモ決済完了 |

## 本番環境へのデプロイ

### 環境変数設定

```env
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx  # 本番キー
CLIENT_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
PORT=3001
```

### 注意事項

- 本番環境では必ずHTTPSを使用
- `STRIPE_SECRET_KEY`に本番用キー（`sk_live_...`）を設定
- `ALLOWED_ORIGINS`に許可するオリジンを設定

## ポートフォリオとしての活用

このデモは以下を示すことができます:

- 外部決済サービス（Stripe）との連携実装
- フロントエンド/バックエンド分離アーキテクチャ
- React Contextを使った状態管理
- TypeScriptによる型安全な実装
- レスポンシブデザイン
- セキュリティ対策（helmet, rate-limit, validation）

**注意**: デモモードおよびStripeテストモードでは、実際の決済は行われません。
