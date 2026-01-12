import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { config } from '../config';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const { url } = await response.json();

      // Stripe Checkoutページにリダイレクト
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('決済処理の開始に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart empty-cart">
        <h1>ショッピングカート</h1>
        <p>カートに商品がありません</p>
        <a href="/" className="continue-shopping">商品一覧に戻る</a>
      </div>
    );
  }

  return (
    <div className="cart">
      <h1>ショッピングカート</h1>
      <div className="cart-items">
        {items.map(item => (
          <div key={item.id} className="cart-item">
            <img src={item.image} alt={item.name} />
            <div className="item-info">
              <h3>{item.name}</h3>
              <p className="price">¥{item.price.toLocaleString()}</p>
            </div>
            <div className="quantity-controls">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="qty-btn"
              >
                -
              </button>
              <span className="quantity">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="qty-btn"
              >
                +
              </button>
            </div>
            <p className="subtotal">
              ¥{(item.price * item.quantity).toLocaleString()}
            </p>
            <button
              onClick={() => removeFromCart(item.id)}
              className="remove-btn"
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="total">
          <span>合計</span>
          <span className="total-price">¥{totalPrice.toLocaleString()}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="checkout-btn"
        >
          {loading ? '処理中...' : 'レジに進む'}
        </button>
{!config.isProduction && (
          <p className="test-card-info">
            テスト用カード番号: 4242 4242 4242 4242
          </p>
        )}
      </div>
    </div>
  );
}
