const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const { notifyOrderConfirmed, notifyOrderDelivered } = require('./utils/notifications');

// Static data fallbacks
const staticProducts = require('./data/products');
const staticUsers = require('./data/users');
const inMemoryOrders = [];

dotenv.config();

const connectDB = require('./config/db').default;
connectDB();

const app = express();

app.disable('x-powered-by');
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: '10kb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' http://localhost:5000 http://localhost:5173 https://sandbox.payhere.lk https://www.payhere.lk; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://www.payhere.lk https://sandbox.payhere.lk; frame-src https://sandbox.payhere.lk https://www.payhere.lk; frame-ancestors 'none';");
  next();
});

const isDBConnected = () => mongoose.connection.readyState === 1;

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Plantopia API! 🌿' });
});

app.get('/api/products', async (req, res) => {
  try {
    if (isDBConnected()) {
      const products = await Product.find({});
      return res.json(products.map(p => ({ ...p.toObject(), id: p._id.toString() })));
    } else {
      console.log('Serving products from static data');
      return res.json(staticProducts);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    if (isDBConnected()) {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json({ ...product.toObject(), id: product._id.toString() });
    } else {
      const product = staticProducts.find(p => p.id === req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json(product);
    }
  } catch (error) {
    res.status(404).json({ message: 'Product not found' });
  }
});

const createToken = (user) => {
  return jwt.sign(
    { email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'plantopia-secret',
    { expiresIn: '7d' }
  );
};

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const ALLOWED_STAFF_EMAILS = [
  'abeywardenamr@gmail.com',
  'maleesharukshan19@gmail.com'
];

const DELIVERY_FEE = 250;

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    // Role check for staff (seller, manager, delivery)
    if (['seller', 'manager', 'delivery'].includes(role)) {
      if (!ALLOWED_STAFF_EMAILS.includes(email.toLowerCase())) {
        return res.status(403).json({ message: 'Unauthorized email. Only specific emails can register as staff.' });
      }
    }

    if (isDBConnected()) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered.' });
      }

      const user = await User.create({ name, email, password, role });
      res.status(201).json({ user: sanitizeUser(user.toObject()), token: createToken(user) });
    } else {
      console.log('Mocking signup (no DB connection)');
      const mockUser = { name, email, role, id: 'mock-' + Date.now() };
      res.status(201).json({ user: mockUser, token: createToken(mockUser) });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Send Reset Link
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    if (isDBConnected()) {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'No account found with this email.' });

      // Generate a simple token (in real app, use crypto.randomBytes)
      const resetToken = jwt.sign({ email }, process.env.JWT_SECRET || 'plantopia-secret', { expiresIn: '1h' });
      
      // In a real app, send email here. For now, we return it for testing.
      console.log(`Reset link for ${email}: http://localhost:5173/reset-password/${resetToken}`);
      res.json({ message: 'Password reset link generated. Check console for the link!' });
    } else {
      res.status(400).json({ message: 'Reset password requires a database connection.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Reset Password - Finalize
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plantopia-secret');
    
    if (isDBConnected()) {
      const user = await User.findOne({ email: decoded.email });
      if (!user) return res.status(404).json({ message: 'User not found.' });

      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password reset successful! You can now login.' });
    } else {
      res.status(400).json({ message: 'Reset password requires a database connection.' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired reset link.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (isDBConnected()) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'No account found with this email. Please sign up first.' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password. Please try again.' });
      }

      res.json({ user: sanitizeUser(user.toObject()), token: createToken(user) });
    } else {
      console.log('Mocking login (no DB connection)');
      const user = staticUsers.find(u => u.email === email);
      if (user && bcrypt.compareSync(password, user.password)) {
        res.json({ user: sanitizeUser(user), token: createToken(user) });
      } else {
        res.status(401).json({ message: 'Invalid credentials or user not found in static data.' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'plantopia-secret');
    
    if (isDBConnected()) {
      const user = await User.findOne({ email: payload.email }).select('-password');
      if (!user) {
        throw new Error('User not found');
      }
      res.json({ user: user.toObject() });
    } else {
      const user = staticUsers.find(u => u.email === payload.email);
      res.json({ user: user ? sanitizeUser(user) : payload });
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { userEmail, userName, items, total, subtotal, tax, address, phone, paymentMethod, orderType } = req.body;

    if (!userEmail || !items || total === undefined || !phone) {
      return res.status(400).json({ message: 'Email, items, phone, and total are required.' });
    }

    const isPickup = orderType === 'Store Pickup';
    const finalShipping = isPickup ? 0 : DELIVERY_FEE;
    const finalTotal = total + finalShipping;

    if (isDBConnected()) {
      const newOrder = await Order.create({
        userEmail,
        userName,
        items,
        total: finalTotal,
        shipping: finalShipping,
        tax: tax || 0,
        address,
        paymentMethod: paymentMethod || 'Cash on Delivery',
        orderType: orderType || 'Home Delivery',
        phone,
        status: 'pending',
      });
      
      // Send Confirmation Notification
      notifyOrderConfirmed(newOrder).catch(err => console.error('Notification Error:', err));

      res.status(201).json({ order: { ...newOrder.toObject(), id: newOrder._id.toString() } });
    } else {
      console.log('Mocking order creation (no DB connection)');
      const mockOrder = { 
        id: 'order-' + Date.now(), 
        userEmail, 
        userName, 
        items, 
        total: finalTotal, 
        shipping: finalShipping,
        tax: tax || 0,
        phone,
        paymentMethod: paymentMethod || 'Cash on Delivery',
        orderType: orderType || 'Home Delivery',
        status: 'pending', 
        createdAt: new Date() 
      };
      inMemoryOrders.push(mockOrder);

      // Send Mock Confirmation
      notifyOrderConfirmed(mockOrder).catch(err => console.error('Notification Error:', err));

      res.status(201).json({ order: mockOrder });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

// Update order to paid
app.put('/api/orders/:id/pay', async (req, res) => {
  try {
    if (isDBConnected()) {
      const order = await Order.findById(req.params.id);
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: req.body.id,
          status: req.body.status,
          update_time: req.body.update_time,
          email_address: req.body.payer.email_address,
        };
        const updatedOrder = await order.save();
        res.json(updatedOrder);
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    } else {
      const order = inMemoryOrders.find(o => o.id === req.params.id);
      if (order) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'paid';
        res.json(order);
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update order status (Staff only)
app.put('/api/orders/:id/status', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'plantopia-secret');
    if (!['manager', 'seller', 'delivery'].includes(payload.role)) {
      return res.status(403).json({ message: 'Access denied. Staff only.' });
    }

    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required.' });

    if (isDBConnected()) {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      
      order.status = status;
      if (status === 'packing') order.packedAt = Date.now();
      if (status === 'shipping') order.shippedAt = Date.now();
      if (status === 'delivered') order.deliveredAt = Date.now();
      await order.save();

      // Trigger Notification if Delivered
      if (status === 'delivered') {
        notifyOrderDelivered(order).catch(err => console.error('Notification Error:', err));
      }

      res.json({ message: 'Order status updated', order });
    } else {
      const order = inMemoryOrders.find(o => o.id === req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      order.status = status;
      if (status === 'delivered') {
        order.deliveredAt = new Date();
        notifyOrderDelivered(order).catch(err => console.error('Notification Error:', err));
      }
      res.json({ message: 'Order status updated (static)', order });
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid token or server error.' });
  }
});

app.get('/api/config/paypal', (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || 'sb'); // 'sb' for sandbox fallback
});


app.get('/api/orders', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'plantopia-secret');
    
    if (isDBConnected()) {
      const user = await User.findOne({ email: payload.email });
      if (!user) {
        throw new Error('User not found');
      }

      let userOrders;
      if (user.role === 'seller' || user.role === 'manager') {
        userOrders = await Order.find({});
      } else {
        userOrders = await Order.find({ userEmail: user.email });
      }
      res.json({ orders: userOrders.map(o => ({ ...o.toObject(), id: o._id.toString() })) });
    } else {
      console.log('Serving orders from in-memory (no DB connection)');
      const userOrders = (payload.role === 'seller' || payload.role === 'manager')
        ? inMemoryOrders 
        : inMemoryOrders.filter(o => o.userEmail === payload.email);
      res.json({ orders: userOrders });
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

// Update product stock (Manager/Staff only)
app.put('/api/products/:id/stock', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'plantopia-secret');
    if (!['manager', 'seller', 'delivery'].includes(payload.role)) {
      return res.status(403).json({ message: 'Access denied. Staff only.' });
    }

    const { countInStock } = req.body;
    if (countInStock === undefined) {
      return res.status(400).json({ message: 'countInStock is required.' });
    }

    if (isDBConnected()) {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      
      product.countInStock = countInStock;
      await product.save();
      res.json({ message: 'Stock updated', product });
    } else {
      const product = staticProducts.find(p => p.id === req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      product.countInStock = countInStock;
      res.json({ message: 'Stock updated (static)', product });
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid token or server error.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


