import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// デモモード: STRIPE_SECRET_KEYが未設定の場合は擬似決済モードで動作
const isDemoMode = !process.env.STRIPE_SECRET_KEY;

// Stripe初期化（デモモードでない場合のみ）
let stripe: Stripe | null = null;
if (!isDemoMode) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });
}

if (isDemoMode) {
  console.log('Running in DEMO MODE - No Stripe API calls will be made');
}

// 擬似セッションストレージ（デモモード用）
const demoSessions = new Map<string, {
  id: string;
  status: string;
  items: Array<{ name: string; price: number; quantity: number; image: string }>;
  totalAmount: number;
  createdAt: Date;
}>();

// セキュリティヘッダー（helmet）
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS設定
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin && !isProduction) {
      return callback(null, true);
    }
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// レート制限
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many checkout requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use(express.json({ limit: '10kb' }));

// キャッシュ制御ヘッダー
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 入力バリデーションスキーマ
const checkoutItemSchema = z.object({
  id: z.string().regex(/^prod_\d+$/, 'Invalid product ID format'),
  quantity: z.number().int().min(1).max(99),
});

const checkoutRequestSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(50),
});

const sessionIdSchema = z.string().regex(/^(cs_|demo_)/, 'Invalid session ID format');

const productIdSchema = z.string().regex(/^prod_\d+$/, 'Invalid product ID format');

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

// デモモード判定API
app.get('/api/config', (req: Request, res: Response) => {
  res.json({ demoMode: isDemoMode });
});

// 商品一覧取得API
app.get('/api/products', (req: Request, res: Response) => {
  res.json(products);
});

// 商品詳細取得API
app.get('/api/products/:id', (req: Request, res: Response) => {
  const parseResult = productIdSchema.safeParse(req.params.id);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Checkout セッション作成API
app.post('/api/create-checkout-session', checkoutLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = checkoutRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: isProduction ? undefined : parseResult.error.issues,
      });
    }

    const { items } = parseResult.data;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // デモモード: 擬似セッションを作成
    if (isDemoMode) {
      const sessionId = `demo_${crypto.randomBytes(16).toString('hex')}`;

      const sessionItems = items.map(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) {
          throw new Error('Product not found');
        }
        return {
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.image,
        };
      });

      const totalAmount = sessionItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      demoSessions.set(sessionId, {
        id: sessionId,
        status: 'pending',
        items: sessionItems,
        totalAmount,
        createdAt: new Date(),
      });

      // デモ用のチェックアウトページURLを返す
      return res.json({
        sessionId,
        url: `${clientUrl}/demo-checkout?session_id=${sessionId}`,
        demoMode: true,
      });
    }

    // 本番モード: Stripe APIを使用
    const lineItems = items.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        throw new Error('Product not found');
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

    const session = await stripe!.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    if (!isProduction) {
      console.error('Checkout session error:', error);
    }
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// デモセッション情報取得API
app.get('/api/demo-session/:sessionId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;

  if (!sessionId.startsWith('demo_')) {
    return res.status(400).json({ error: 'Invalid demo session ID' });
  }

  const session = demoSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(session);
});

// デモ決済完了API
app.post('/api/demo-complete/:sessionId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;

  if (!sessionId.startsWith('demo_')) {
    return res.status(400).json({ error: 'Invalid demo session ID' });
  }

  const session = demoSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // セッションを完了状態に更新
  session.status = 'complete';
  demoSessions.set(sessionId, session);

  res.json({ success: true, session });
});

// 決済セッション情報取得API
app.get('/api/checkout-session/:sessionId', async (req: Request, res: Response) => {
  try {
    const parseResult = sessionIdSchema.safeParse(req.params.sessionId);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const sessionId = req.params.sessionId;

    // デモセッションの場合
    if (sessionId.startsWith('demo_')) {
      const session = demoSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.json({
        id: session.id,
        payment_status: session.status === 'complete' ? 'paid' : 'unpaid',
        amount_total: session.totalAmount,
        line_items: {
          data: session.items.map(item => ({
            description: item.name,
            quantity: item.quantity,
            amount_total: item.price * item.quantity,
          })),
        },
      });
    }

    // Stripeセッションの場合
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    });
    res.json(session);
  } catch (error) {
    if (!isProduction) {
      console.error('Session retrieval error:', error);
    }
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// 404ハンドラー
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// グローバルエラーハンドラー
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (!isProduction) {
    console.error('Unhandled error:', err);
  }
  res.status(500).json({ error: 'Internal server error' });
});

// 古いデモセッションを定期的にクリーンアップ（1時間以上前のセッション）
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [id, session] of demoSessions.entries()) {
    if (session.createdAt < oneHourAgo) {
      demoSessions.delete(id);
    }
  }
}, 15 * 60 * 1000); // 15分ごとにクリーンアップ

app.listen(PORT, () => {
  if (!isProduction) {
    console.log(`Server running on http://localhost:${PORT}`);
    if (isDemoMode) {
      console.log('Demo mode enabled - using mock payment flow');
    }
  }
});
