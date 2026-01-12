// API URL設定
// 本番環境ではVITE_API_URLの設定が必須
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL && import.meta.env.PROD) {
  throw new Error('VITE_API_URL environment variable is required in production');
}

export const config = {
  apiUrl: API_URL || 'http://localhost:3001',
  isProduction: import.meta.env.PROD,
} as const;
