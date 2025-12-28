import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    // 決済成功時にカートをクリア（一度だけ実行）
    if (!hasCleared.current) {
      clearCart();
      hasCleared.current = true;
    }
  }, [clearCart]);

  return (
    <div className="result-page success">
      <div className="result-icon">✓</div>
      <h1>ご注文ありがとうございます！</h1>
      <p>決済が正常に完了しました。</p>
      {sessionId && (
        <p className="session-id">
          セッションID: {sessionId.slice(0, 20)}...
        </p>
      )}
      <div className="result-actions">
        <a href="/" className="back-to-shop">
          ショップに戻る
        </a>
      </div>
    </div>
  );
}
