import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CURRENCY } from '../utils/constants';

const ProductCard = ({ product, onAddToCart, showAddButton = false }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fallbackImg = 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&q=80&w=400';

  return (
    <div className="product-card glass-card">
      <div className="product-card-img-wrapper">
        {!imgLoaded && !imgError && (
          <div className="product-card-placeholder">
            <span>🌿</span>
          </div>
        )}
        <img
          src={imgError ? fallbackImg : product.image}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{ opacity: imgLoaded || imgError ? 1 : 0 }}
        />
        {product.countInStock <= 3 && product.countInStock > 0 && (
          <span className="product-card-badge badge-limited">Only {product.countInStock} left</span>
        )}
        {product.countInStock === 0 && (
          <span className="product-card-badge badge-out">Out of Stock</span>
        )}
        <span className="product-card-category">{product.category}</span>
      </div>

      <div className="product-card-body">
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>

        <div className="product-card-meta">
          <span title="Light">☀️ {product.lightRequirement}</span>
          <span title="Watering">💧 {product.wateringFrequency}</span>
          {product.petFriendly && <span title="Pet Friendly">🐾 Safe</span>}
        </div>

        <div className="product-card-footer">
          <p className="product-card-price">{CURRENCY} {product.price.toLocaleString()}</p>
          <div className="product-card-actions">
            <Link to={`/product/${product.id}`} className="btn-secondary product-card-btn">View</Link>
            {showAddButton && product.countInStock > 0 && (
              <button className="btn-primary product-card-btn" onClick={() => onAddToCart(product)}>
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
