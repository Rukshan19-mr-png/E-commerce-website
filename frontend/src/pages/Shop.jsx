import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { useCart } from '../context/CartContext';
import { API_BASE, CATEGORIES } from '../utils/constants';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';
  const queryCategory = searchParams.get('category') || 'All';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(queryCategory);
  const [searchTerm, setSearchTerm] = useState(querySearch);
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

  // Sync state with URL query parameters during render to avoid cascading useEffect renders
  const [prevQuerySearch, setPrevQuerySearch] = useState(querySearch);
  const [prevQueryCategory, setPrevQueryCategory] = useState(queryCategory);

  if (querySearch !== prevQuerySearch) {
    setSearchTerm(querySearch);
    setPrevQuerySearch(querySearch);
  }
  if (queryCategory !== prevQueryCategory) {
    setActiveCategory(queryCategory);
    setPrevQueryCategory(queryCategory);
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const clearFilters = () => {
    setSearchParams({});
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const newParams = {};
    if (value) newParams.search = value;
    if (activeCategory !== 'All') newParams.category = activeCategory;
    setSearchParams(newParams);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    const newParams = {};
    if (searchTerm) newParams.search = searchTerm;
    if (cat !== 'All') newParams.category = cat;
    setSearchParams(newParams);
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="section-title" style={{ textAlign: 'left', marginBottom: '3rem' }}>
          <h2>Shop Plants</h2>
          <p style={{ margin: 0 }}>Browse our curated collection of {products.length} rare and beautiful Sri Lankan plants.</p>
        </div>

        <div className="search-filter-section">
          <div className="search-bar-container">
            <div className="search-icon-wrapper">
              <Search size={20} />
            </div>
            <input
              type="text"
              className="search-input-field"
              placeholder="Search by plant name or category..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button 
                onClick={() => {
                  const newParams = {};
                  if (activeCategory !== 'All') newParams.category = activeCategory;
                  setSearchParams(newParams);
                }}
                style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <SlidersHorizontal size={16} color="var(--primary)" />
              <span className="filter-label">Filter by Category</span>
            </div>
            <div className="category-chips">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                  {cat !== 'All' && (
                    <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '0.8rem' }}>
                      ({products.filter(p => p.category === cat).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {(activeCategory !== 'All' || searchTerm) && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <X size={14} /> Clear all filters
            </button>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '1.2rem' }}>Loading plants...</p>
          </div>
        )}
        {error && <p style={{ color: 'red', padding: '2rem' }}>{error}</p>}
        
        {!loading && !error && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                Showing {filteredProducts.length} plant{filteredProducts.length !== 1 ? 's' : ''}
                {(activeCategory !== 'All' || searchTerm) && " matching your criteria"}
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <ProductGrid products={filteredProducts} showAddButton onAddToCart={addToCart} />
            ) : (
              <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center', background: '#fff' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🌱</div>
                <h3 style={{ marginBottom: '0.5rem' }}>No plants found</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 2rem' }}>
                  We couldn't find any plants matching "{searchTerm || activeCategory}". Try adjusting your filters or search term.
                </p>
                <button className="btn-primary" onClick={clearFilters}>
                  Show All Plants
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Shop;
