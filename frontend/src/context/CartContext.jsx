import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../utils/constants';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('plantopiaCart');
    return saved ? JSON.parse(saved) : [];
  });

  // On mount, verify current cart items against latest stock
  useEffect(() => {
    const validateCart = async () => {
      if (!cart || cart.length === 0) return;
      const removed = [];
      let updated = [...cart];
      for (const item of cart) {
        try {
          const res = await fetch(`${API_BASE}/api/products/${item.id || item._id}`);
          if (!res.ok) continue;
          const prod = await res.json();
          const available = prod.countInStock ?? prod.count ?? 0;
          if (available < item.quantity) {
            updated = updated.filter((c) => (c.id || c._id) !== (item.id || item._id));
            removed.push({ name: item.name, available });
          }
        } catch (err) {
          // ignore network errors for individual items
        }
      }
      if (removed.length > 0) {
        setCart(updated);
        const names = removed.map(r => `${r.name} (only ${r.available} left)`).join(', ');
        alert(`Some items were removed from your cart due to stock changes: ${names}`);
      }
    };

    validateCart();
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('plantopiaCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = async (product) => {
    // ensure latest stock before adding
    try {
      let available = product.countInStock;
      if (available === undefined) {
        const res = await fetch(`${API_BASE}/api/products/${product.id || product._id}`);
        if (res.ok) {
          const prod = await res.json();
          available = prod.countInStock ?? prod.count ?? 0;
        }
      }
      if (available <= 0) {
        alert('This product is currently out of stock.');
        return;
      }
    } catch (err) {
      // if check fails, allow add and let backend validate on order
    }

    setCart((prev) => {
      const existing = prev.find((item) => (item.id || item._id) === (product.id || product._id));
      if (existing) {
        return prev.map((item) =>
          (item.id || item._id) === (product.id || product._id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
