import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe初期化（テストモード用シークレットキー）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(express.json());

// 商品データ（デモ用）
const products = [
  {
    id: 'prod_1',
    name: 'プレミアムTシャツ',
    price: 3980,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    description: '高品質コットン100%のプレミアムTシャツ',
  },
  {
    id: 'prod_2',
    name: 'ヴィンテージ風デニムパンツ',
    price: 12800,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400',
    description: 'ヴィンテージ風デニムパンツ',
  },
  {
    id: 'prod_3',
    name: 'レザースニーカー',
    price: 8900,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    description: '本革使用の高級スニーカー',
  },
  {
    id: 'prod_4',
    name: 'キャンバストートバッグ',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400',
    description: '大容量キャンバス素材トートバッグ',
  },
  {
    id: 'prod_5',
    name: 'ウールニットセーター',
    price: 9800,
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400',
    description: '柔らかなウール素材の暖かいセーター',
  },
  {
    id: 'prod_6',
    name: 'レザー・バックパック',
    price: 5500,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    description: 'レザー・クラシックバックパック',
  },
];

// 商品一覧取得API
app.get('/api/products', (req, res) => {
  res.json(products);
});

// 商品詳細取得API
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Stripe Checkout セッション作成API
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body as {
      items: Array<{ id: string; quantity: number }>;
    };

    // カート内の商品情報を取得
    const lineItems = items.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        throw new Error(`Product not found: ${item.id}`);
      }
      return {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: product.price,
        },
        quantity: item.quantity,
      };
    });

    // Stripe Checkout セッション作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// 決済セッション情報取得API
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['line_items', 'payment_intent'],
    });
    res.json(session);
  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
