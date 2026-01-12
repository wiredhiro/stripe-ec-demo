import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { config } from '../config';

interface DemoSession {
  id: string;
  status: string;
  items: Array<{ name: string; price: number; quantity: number; image: string }>;
  totalAmount: number;
}

export default function DemoCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [session, setSession] = useState<DemoSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    fetch(`${config.apiUrl}/api/demo-session/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Session not found');
        return res.json();
      })
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => {
        navigate('/');
      });
  }, [sessionId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;

    setProcessing(true);

    // 擬似的な処理時間（1.5秒）
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch(`${config.apiUrl}/api/demo-complete/${sessionId}`, {
        method: 'POST',
      });

      if (response.ok) {
        navigate(`/success?session_id=${sessionId}`);
      } else {
        alert('決済処理に失敗しました');
        setProcessing(false);
      }
    } catch {
      alert('決済処理に失敗しました');
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/cancel');
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.substring(0, 2) + '/' + numbers.substring(2, 4);
    }
    return numbers;
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!session) {
    return <div className="loading">セッションが見つかりません</div>;
  }

  return (
    <div className="demo-checkout">
      <div className="demo-checkout-container">
        <div className="demo-banner">
          デモモード - 実際の決済は行われません
        </div>

        <div className="checkout-content">
          <div className="order-summary">
            <h2>注文内容</h2>
            <div className="order-items">
              {session.items.map((item, index) => (
                <div key={index} className="order-item">
                  <img src={item.image} alt={item.name} />
                  <div className="item-details">
                    <p className="item-name">{item.name}</p>
                    <p className="item-qty">数量: {item.quantity}</p>
                  </div>
                  <p className="item-price">
                    ¥{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="order-total">
              <span>合計</span>
              <span>¥{session.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <h2>お支払い情報</h2>

            <div className="form-group">
              <label htmlFor="cardNumber">カード番号</label>
              <input
                type="text"
                id="cardNumber"
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                required
                disabled={processing}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiry">有効期限</label>
                <input
                  type="text"
                  id="expiry"
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                  disabled={processing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cvc">セキュリティコード</label>
                <input
                  type="text"
                  id="cvc"
                  value={cvc}
                  onChange={e => setCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                  placeholder="123"
                  maxLength={3}
                  required
                  disabled={processing}
                />
              </div>
            </div>

            <p className="demo-hint">
              任意の値を入力してください（デモのため検証されません）
            </p>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="cancel-btn"
                disabled={processing}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="pay-btn"
                disabled={processing}
              >
                {processing ? '処理中...' : `¥${session.totalAmount.toLocaleString()} を支払う`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
