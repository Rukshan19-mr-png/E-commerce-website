import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE, CURRENCY } from '../utils/constants';

const Delivery = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [auth]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      // Only show orders that are not delivered yet for delivery personnel
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  if (!['manager', 'seller', 'delivery'].includes(auth?.user?.role)) {
    return <div className="container" style={{ padding: '4rem 1rem' }}><h2>Access Denied</h2></div>;
  }

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Delivery & Shipping Management</h2>
      
      {loading && <p>Loading active orders...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && orders.length === 0 && <p>No active orders to manage.</p>}

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {orders.map((order) => (
          <div key={order.id} className="glass-card" style={{ padding: '2rem', borderRadius: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.5rem' }}>Order #{order.id.slice(-8).toUpperCase()}</h3>
                <p><strong>Customer:</strong> {order.userName} ({order.userEmail})</p>
                <p><strong>Address:</strong> {order.address}</p>
                <p style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
                  Current Status: <span style={{ textTransform: 'uppercase' }}>{order.status}</span>
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.2rem' }}>{CURRENCY} {order.total.toLocaleString()}</p>
                
                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    className="btn-primary" 
                    style={{ background: '#ffa502', borderColor: '#ffa502', padding: '0.5rem' }}
                    onClick={() => updateStatus(order.id, 'packing')}
                    disabled={order.status === 'packing'}
                  >
                    Mark as Packing
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ background: '#2f3542', borderColor: '#2f3542', padding: '0.5rem' }}
                    onClick={() => updateStatus(order.id, 'shipping')}
                    disabled={order.status === 'shipping'}
                  >
                    Mark as Shipped
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ background: '#2ed573', borderColor: '#2ed573', padding: '0.5rem' }}
                    onClick={() => updateStatus(order.id, 'delivered')}
                    disabled={order.status === 'delivered'}
                  >
                    Mark as Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Delivery;
