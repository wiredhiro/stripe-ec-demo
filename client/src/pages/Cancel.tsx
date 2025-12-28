export default function Cancel() {
  return (
    <div className="result-page cancel">
      <div className="result-icon">✕</div>
      <h1>決済がキャンセルされました</h1>
      <p>お支払いは完了していません。</p>
      <p>カートの商品は保持されています。</p>
      <div className="result-actions">
        <a href="/cart" className="back-to-cart">
          カートに戻る
        </a>
        <a href="/" className="back-to-shop">
          ショップに戻る
        </a>
      </div>
    </div>
  );
}
