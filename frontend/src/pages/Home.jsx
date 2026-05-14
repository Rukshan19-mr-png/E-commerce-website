import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { API_BASE } from '../utils/constants';

const Home = () => {
  const [apiMessage, setApiMessage] = useState('Connecting to backend...');
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const messageRes = await fetch(`${API_BASE}/api`);
        const productsRes = await fetch(`${API_BASE}/api/products`);

        if (messageRes.ok) {
          const messageData = await messageRes.json();
          setApiMessage(messageData.message);
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          // Show 8 premium plants on home
          setProducts(productsData.slice(0, 8));
        }
      } catch {
        setApiMessage('Welcome to Plantopia 🌿');
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const features = [
    { icon: '🚚', title: 'Islandwide Delivery', desc: 'Fast and secure delivery across Sri Lanka.' },
    { icon: '🍃', title: 'Premium Quality', desc: 'Hand-picked specimens for your home.' },
    { icon: '🤝', title: 'Expert Support', desc: 'Professional care guides for every plant.' },
    { icon: '💎', title: 'Rare Specimens', desc: 'Exclusive collection of endemic flora.' },
  ];

  const categories = [
    { title: 'Flower Plants', img: 'https://images.unsplash.com/photo-1541414779316-956a5084c0d4?auto=format&fit=crop&q=80&w=800' },
    { title: 'Fruit Plants', img: '/images/plants/dragon_fruit.png' },
    { title: 'Other Plants', img: '/images/plants/money_tree.png' },
  ];

  return (
    <main>
      <div className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ width: '100%', maxWidth: '900px' }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span className="badge">Sri Lanka's Finest</span>
            <span className="badge">Established 2024</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(3rem, 10vw, 5.5rem)', lineHeight: 1.1, fontWeight: 800 }}>
            Bring Life to <br /> <span style={{ color: 'var(--accent)' }}>Your Space</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem', marginTop: '1.5rem', maxWidth: '700px', margin: '1.5rem auto 2.5rem' }}>
            Discover a curated collection of exotic Sri Lankan plants, from majestic flowers to organic fruit saplings.
          </p>

          <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto 3rem', position: 'relative' }}>
            <div className="search-bar-container" style={{ marginBottom: 0, maxWidth: 'none' }}>
              <div className="search-icon-wrapper">
                <Search size={22} color="var(--primary)" />
              </div>
              <input
                type="text"
                className="search-input-field"
                placeholder="What plant are you looking for?"
                style={{ padding: '1.4rem 1.5rem 1.4rem 3.8rem', fontSize: '1.2rem', background: 'rgba(255,255,255,0.95)' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ position: 'absolute', right: '8px', top: '8px', bottom: '8px', padding: '0 24px', borderRadius: '40px' }}
              >
                Search
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center' }}>
            <Link to="/shop" className="btn-secondary" style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>Browse All</Link>
            <Link to="/care" className="btn-secondary" style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>Care Guides</Link>
          </div>
        </motion.div>
      </div>

      <section className="container" style={{ padding: '6rem 0' }}>
        <div className="section-title">
          <h2>Featured Categories</h2>
          <p>Explore our specialized plant collections designed for every garden style.</p>
        </div>
        <div className="category-grid">
          {categories.map((cat, i) => (
            <motion.div 
              key={i} 
              className="category-card"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/shop?search=${encodeURIComponent(cat.title.replace(' Plants', ''))}`)}
            >
              <img src={cat.img} alt={cat.title} />
              <div className="category-overlay">
                <h3>{cat.title}</h3>
                <p>Browse {cat.title.toLowerCase()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--secondary)', padding: '6rem 0' }}>
        <div className="container">
          <div className="section-title">
            <h2>Why Choose Plantopia?</h2>
            <p>We pride ourselves on quality, sustainability, and expert knowledge.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <motion.div 
                key={i} 
                className="feature-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="feature-icon">{f.icon}</span>
                <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>{f.title}</h4>
                <p style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '6rem 0' }}>
        <div className="section-title">
          <h2>Trending Specimens</h2>
          <p>Our most sought-after plants this season.</p>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p style={{ textAlign: 'center' }}>Loading products...</p>
        )}
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <Link to="/shop" className="btn-secondary" style={{ padding: '14px 32px' }}>View Full Catalog</Link>
        </div>
      </section>

      <section style={{ padding: '6rem 0', background: 'var(--primary-dark)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: '#fff' }}>Join Our Green Community</h2>
          <p style={{ fontSize: '1.2rem', opacity: 0.8, maxWidth: '700px', margin: '0 auto 3rem' }}>
            Subscribe to get care tips, exclusive offers, and early access to rare plant drops.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <input 
              type="email" 
              placeholder="Your email address" 
              style={{ padding: '16px 24px', borderRadius: '40px', border: 'none', flex: 1, fontSize: '1rem' }}
            />
            <button className="btn-primary" style={{ background: 'var(--accent)', color: 'var(--primary-dark)' }}>Subscribe</button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
