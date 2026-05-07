import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProductGrid from '../components/ProductGrid';
import { useCart } from '../context/CartContext';
import { API_BASE, CATEGORIES } from '../utils/constants';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) {
          throw new Error('Failed to load products from backend');
        }
        const data = await res.json();
        setProducts(data);
      } catch {
        setError('Unable to load products. Please make sure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="section-title" style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h2>Shop Plants</h2>
          <p style={{ margin: 0 }}>Browse our curated collection of {products.length} rare and beautiful Sri Lankan plants.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? "btn-primary" : "btn-secondary"}
              onClick={() => setActiveCategory(cat)}
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.5rem', borderRadius: '30px' }}
            >
              {cat}
              {cat !== 'All' && (
                <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                  ({products.filter(p => cat === 'All' || p.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '1.2rem' }}>Loading plants...</p>
          </div>
        )}
        {error && <p style={{ color: 'red', padding: '2rem' }}>{error}</p>}
        {!loading && !error && (
          <>
            {filteredProducts.length > 0 ? (
              <>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Showing {filteredProducts.length} plant{filteredProducts.length !== 1 ? 's' : ''}
                </p>
                <ProductGrid products={filteredProducts} showAddButton onAddToCart={addToCart} />
              </>
            ) : (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem' }}>No plants found in this category.</p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Shop;
