import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_BASE, CURRENCY } from '../utils/constants';
import { motion } from 'framer-motion';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) {
          throw new Error('Product not found');
        }
        const data = await res.json();
        setProduct(data);
        setActiveImg(data.image);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: '4rem 1rem' }}><p>Loading product...</p></div>;
  }

  if (error) {
    return <div className="container" style={{ padding: '4rem 1rem' }}><p style={{ color: 'red' }}>{error}</p></div>;
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <div className="glass-card product-detail-grid" style={{ padding: '2.5rem', borderRadius: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div className="product-gallery">
          <motion.img
            key={activeImg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={activeImg}
            alt={product.name}
            style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '20px', marginBottom: '1rem' }}
          />
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${product.name} ${idx}`}
                  onClick={() => setActiveImg(img)}
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    objectFit: 'cover', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    border: activeImg === img ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-info" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="badge" style={{ marginBottom: '1rem' }}>{product.category}</span>
            <h2 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>{product.name}</h2>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{CURRENCY} {product.price.toLocaleString()}</p>
          </div>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>{product.description}</p>
          
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.4)', borderRadius: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <p><strong>☀️ Light:</strong> {product.lightRequirement}</p>
              <p><strong>💧 Water:</strong> {product.wateringFrequency}</p>
              <p><strong>🐾 Pet Friendly:</strong> {product.petFriendly ? 'Yes' : 'No'}</p>
              <p><strong>📦 Stock:</strong> {product.countInStock > 0 ? `${product.countInStock} available` : <span style={{ color: '#d00' }}>Out of Stock</span>}</p>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '1.25rem', fontSize: '1.2rem' }}
              onClick={() => addToCart(product)}
              disabled={product.countInStock <= 0}
            >
              {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              🚚 Free shipping on orders over {CURRENCY} 5,000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
