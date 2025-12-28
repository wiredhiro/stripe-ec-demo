import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          EC Demo Shop
        </Link>
        <nav>
          <Link to="/" className="nav-link">商品一覧</Link>
          <Link to="/cart" className="nav-link cart-link">
            カート
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
