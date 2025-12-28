# EC Demo Shop - Stripe決済連携デモ

Stripe Checkoutを使用したEC決済フローのデモアプリケーションです。

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Node.js + Express + TypeScript
- **決済**: Stripe Checkout (テストモード)

## セットアップ手順

### 1. Stripeアカウントの準備

1. [Stripe](https://stripe.com/jp)でアカウントを作成（無料）
2. ダッシュボードで「テストモード」に切り替え
3. [APIキー](https://dashboard.stripe.com/test/apikeys)ページから以下を取得:
   - 公開可能キー (`pk_test_...`)
   - シークレットキー (`sk_test_...`)

### 2. バックエンドのセットアップ

```bash
cd server
cp .env.example .env
# .envファイルにStripeシークレットキーを設定
npm install
npm run dev
```

### 3. フロントエンドのセットアップ

```bash
cd client
cp .env.example .env
# .envファイルにStripe公開キーを設定
npm install
npm run dev
```

### 4. 動作確認

- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:3001

## テスト用カード情報

Stripeテストモードでは以下のカード番号が使用できます:

| カード種別 | カード番号 | 結果 |
|-----------|-----------|------|
| Visa | 4242 4242 4242 4242 | 成功 |
| Mastercard | 5555 5555 5555 4444 | 成功 |
| 拒否 | 4000 0000 0000 0002 | 失敗 |

- 有効期限: 未来の日付（例: 12/34）
- CVC: 任意の3桁（例: 123）
- 郵便番号: 任意（例: 123-4567）

## 機能一覧

- 商品一覧表示
- カート機能（追加/削除/数量変更）
- Stripe Checkout による決済
- 決済成功/キャンセル画面

## プロジェクト構造

```
stripe-ec-demo/
├── client/                 # フロントエンド
│   ├── src/
│   │   ├── components/    # 共通コンポーネント
│   │   ├── context/       # React Context (カート状態)
│   │   ├── pages/         # ページコンポーネント
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
| GET | /api/products | 商品一覧取得 |
| GET | /api/products/:id | 商品詳細取得 |
| POST | /api/create-checkout-session | Stripe決済セッション作成 |
| GET | /api/checkout-session/:sessionId | 決済セッション情報取得 |

## ポートフォリオとしての活用

このデモは以下を示すことができます:

- 外部決済サービス（Stripe）との連携実装
- フロントエンド/バックエンド分離アーキテクチャ
- React Contextを使った状態管理
- TypeScriptによる型安全な実装
- レスポンシブデザイン

**注意**: テストモードのため、実際の決済は行われません。
