import { useState, useEffect } from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { config } from '../config';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`${config.apiUrl}/api/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="product-list">
      <h1>商品一覧</h1>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <div className="product-info">
              <h2>{product.name}</h2>
              <p className="description">{product.description}</p>
              <p className="price">¥{product.price.toLocaleString()}</p>
              <button
                onClick={() => addToCart(product)}
                className="add-to-cart-btn"
              >
                カートに追加
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
