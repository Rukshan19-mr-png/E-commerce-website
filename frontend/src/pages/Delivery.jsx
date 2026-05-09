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

  const activeOrders = orders.filter(o => o.status !== 'delivered');
  const completedOrders = orders.filter(o => o.status === 'delivered');

  if (!['manager', 'seller', 'delivery'].includes(auth?.role)) {
    return <div className="container" style={{ padding: '4rem 1rem' }}><h2>Access Denied</h2></div>;
  }

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        🚚 Delivery & Shipping Management
      </h2>
      
      {loading && <p>Loading active orders...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '4rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>📦 Active Shipments ({activeOrders.length})</h3>
        {!loading && activeOrders.length === 0 && (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>No active orders currently waiting for shipment.</p>
          </div>
        )}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {activeOrders.map((order) => (
            <div key={order.id} className="glass-card" style={{ padding: '2rem', borderRadius: '24px', borderLeft: '8px solid #ffa502' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>Order #{order.id.slice(-8).toUpperCase()}</h3>
                    <span className="badge" style={{ background: '#ffa502', color: '#fff' }}>{order.status}</span>
                  </div>
                  <p style={{ marginBottom: '1rem' }}><strong>Customer:</strong> {order.userName} ({order.userEmail})</p>
                  <p><strong>Address:</strong> {order.address}</p>
                  
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {order.packedAt && <span>✅ Packed: {new Date(order.packedAt).toLocaleTimeString()}</span>}
                    {order.shippedAt && <span>🚚 Shipped: {new Date(order.shippedAt).toLocaleTimeString()}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                  <p style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem' }}>{CURRENCY} {order.total.toLocaleString()}</p>
                  
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <button 
                      className="btn-primary" 
                      style={{ background: '#ffa502', borderColor: '#ffa502', padding: '0.6rem' }}
                      onClick={() => updateStatus(order.id, 'packing')}
                      disabled={order.status === 'packing' || order.status === 'shipping'}
                    >
                      {order.status === 'packing' ? '✓ In Packing' : 'Start Packing'}
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ background: '#2f3542', borderColor: '#2f3542', padding: '0.6rem' }}
                      onClick={() => updateStatus(order.id, 'shipping')}
                      disabled={order.status === 'shipping'}
                    >
                      {order.status === 'shipping' ? '✓ On the Way' : 'Mark as Shipped'}
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ background: '#2ed573', borderColor: '#2ed573', padding: '0.6rem' }}
                      onClick={() => updateStatus(order.id, 'delivered')}
                    >
                      Complete Delivery
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>🏁 Completed Deliveries ({completedOrders.length})</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {completedOrders.map((order) => (
            <div key={order.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', opacity: 0.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Order #{order.id.slice(-8).toUpperCase()}</h4>
                  <p style={{ margin: '5px 0 0', fontSize: '0.85rem' }}>Delivered to {order.userName} on {new Date(order.deliveredAt).toLocaleDateString()}</p>
                </div>
                <div style={{ color: '#2ed573', fontWeight: 700 }}>✅ Delivered</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Delivery;
