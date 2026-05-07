import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE, CURRENCY } from '../utils/constants';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) fetchOrders();
  }, [auth]);

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Your Order History</h2>
      
      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && orders.length === 0 && (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>You haven't placed any orders yet.</p>
        </div>
      )}
      
      {!loading && orders.length > 0 && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="glass-card" style={{ padding: '2rem', borderRadius: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Order #{order.id.slice(-8).toUpperCase()}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </p>

                  {/* Order Status Tracker */}
                  <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '16px' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', color: 'var(--primary)' }}>Track Status:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                      {['pending', 'packing', 'shipping', 'delivered'].map((step, index) => {
                        const statusOrder = ['pending', 'packing', 'shipping', 'delivered'];
                        const currentIndex = statusOrder.indexOf(order.status?.toLowerCase() || 'pending');
                        const isCompleted = index <= currentIndex;
                        
                        const labels = {
                          pending: 'Placed',
                          packing: 'Packing',
                          shipping: 'Shipping',
                          delivered: 'Delivered'
                        };

                        return (
                          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                            <div style={{ 
                              width: '30px', 
                              height: '30px', 
                              borderRadius: '50%', 
                              background: isCompleted ? 'var(--primary)' : '#e0e0e0',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              transition: 'all 0.3s'
                            }}>
                              {isCompleted ? '✓' : index + 1}
                            </div>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              marginTop: '0.5rem', 
                              fontWeight: isCompleted ? 700 : 400,
                              color: isCompleted ? 'var(--primary-dark)' : '#999'
                            }}>
                              {labels[step]}
                            </span>
                          </div>
                        );
                      })}
                      {/* Connector Line */}
                      <div style={{ 
                        position: 'absolute', 
                        top: '15px', 
                        left: '10%', 
                        right: '10%', 
                        height: '2px', 
                        background: '#e0e0e0', 
                        zIndex: 0 
                      }}></div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                        <span>{item.name} x {item.quantity}</span>
                        <span>{CURRENCY} {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    background: order.status === 'pending' ? '#fff3cd' : '#d1e7dd', 
                    color: order.status === 'pending' ? '#856404' : '#0f5132',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '1rem'
                  }}>
                    {order.status}
                  </div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {CURRENCY} {order.total.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {order.paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
