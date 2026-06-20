import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/constants';

const ManagerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockInputs, setStockInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch(`${API_BASE}/api/orders`, { headers: { Authorization: `Bearer ${auth.token}` } }),
          fetch(`${API_BASE}/api/products`)
        ]);

        if (!ordersRes.ok || !productsRes.ok) throw new Error('Failed to load data');
        
        const ordersData = await ordersRes.json();
        const productsData = await productsRes.json();
        
        setOrders(ordersData.orders || []);
        setProducts(productsData || []);
        setStockInputs(
          (productsData || []).reduce((acc, product) => {
            acc[product.id || product._id] = product.countInStock;
            return acc;
          }, {})
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) fetchData();
  }, [auth]);

  const handleUpdateStock = async (id, newStock) => {
    const parsedStock = parseInt(newStock, 10);
    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      alert('Please provide a valid stock value.');
      return;
    }

    setUpdating(id);
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ countInStock: parsedStock }),
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, countInStock: parsedStock } : p));
        setStockInputs(prev => ({ ...prev, [id]: parsedStock }));
        alert('Stock updated successfully!');
      } else {
        alert('Failed to update stock');
      }
    } catch {
      alert('Error updating stock');
    } finally {
      setUpdating(null);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return <div className="container" style={{ padding: '4rem 1rem' }}><p>Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="container" style={{ padding: '4rem 1rem' }}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Staff Dashboard - Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{orders.length}</p>
        </div>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Revenue</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>Rs. {totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <section>
          <h3 style={{ marginBottom: '1.5rem' }}>Recent Orders</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {orders.slice(0, 10).map(order => (
              <div key={order.id} className="glass-card" style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{order.userName}</strong>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Rs. {order.total.toLocaleString()}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {new Date(order.createdAt).toLocaleDateString()} — {order.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 style={{ marginBottom: '1.5rem' }}>Inventory Management</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {products.map(product => (
              <div key={product.id} className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>{product.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock: {product.countInStock}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={stockInputs[product.id || product._id] ?? product.countInStock}
                    onChange={(e) => setStockInputs((prev) => ({ ...prev, [product.id || product._id]: e.target.value }))}
                    style={{ width: '70px', padding: '6px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
                  />
                  <button
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => handleUpdateStock(product.id || product._id, stockInputs[product.id || product._id])}
                    disabled={updating === (product.id || product._id)}
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManagerDashboard;
