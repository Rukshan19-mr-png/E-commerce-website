const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load env vars FIRST before anything else
dotenv.config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const { notifyOrderConfirmed, notifyOrderDelivered, sendResetCode } = require('./utils/notifications');

// Static data fallbacks
const staticProducts = require('./data/products');
const staticUsers = require('./data/users');
const inMemoryOrders = [];
const inMemoryResetCodes = {}; // { email: { code, expire } }

const connectDB = require('./config/db');

// Attempt DB connection before starting server so logs reflect real state
let dbConnected = false;
connectDB()
  .then(() => { dbConnected = true; })
  .catch(() => { dbConnected = false; })
  .finally(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`MongoDB connected: ${dbConnected}`);
    });
  });

const app = express();

// Payment gateway configs handled separately (PayHere removed)

// Build allowed origins from env var (comma-separated) + always include localhost for dev
const productionOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  ...productionOrigins,
];

app.disable('x-powered-by');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  // Build dynamic CSP that includes production domain if set
  const productionFrontend = process.env.ALLOWED_ORIGINS || '';
  const productionBackend = process.env.BACKEND_URL || '';
  const connectSrc = [
    "'self'",
    'http://localhost:5000',
    'http://localhost:5173',
    'https://www.paypal.com',
    'https://api.paypal.com',
    ...(productionFrontend ? productionFrontend.split(',').map(o => o.trim()) : []),
    ...(productionBackend ? [productionBackend] : []),
  ].join(' ');

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy',
    `default-src 'self'; connect-src ${connectSrc}; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://www.paypal.com; frame-src https://www.paypal.com; frame-ancestors 'none';`);
  next();
});

const isDBConnected = () => mongoose.connection.readyState === 1;

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Plantopia API! 🌿' });
});

// Debug endpoint (development only) - reports DB connection and sample counts
app.get('/api/debug/db', async (req, res) => {
  try {
    const connected = isDBConnected();
    const info = { connected };
    if (connected) {
      try {
        const count = await Product.countDocuments();
        info.products = count;
      } catch (e) {
        info.products = 'error';
      }
    }
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    const { name, email, password, role, phoneNumber } = req.body;

    if (!name || !email || !password || !role || !phoneNumber) {
      return res.status(400).json({ message: 'Name, email, password, role, and phone number are required.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Phone number validation (Sri Lanka format: +947xxxxxxxx or 07xxxxxxxx)
    const phoneRegex = /^(?:\+94|0)7[0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Please enter a valid Sri Lankan phone number (e.g. 0771234567).' });
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

      const user = await User.create({ name, email, password, role, phoneNumber });
      res.status(201).json({ user: sanitizeUser(user.toObject()), token: createToken(user) });
    } else {
      console.log('Mocking signup (no DB connection)');
      const existingUser = staticUsers.find(u => u.email === email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered in static data.' });
      }
      
      const hashedPassword = bcrypt.hashSync(password, 10);
      const mockUser = { name, email, role, phoneNumber, password: hashedPassword, id: 'mock-' + Date.now() };
      staticUsers.push(mockUser);
      
      res.status(201).json({ user: sanitizeUser(mockUser), token: createToken(mockUser) });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Send Reset Code
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (isDBConnected()) {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'No account found with this email.' });

      user.resetCode = resetCode;
      user.resetCodeExpire = resetCodeExpire;
      await user.save();
    } else {
      console.log('Mocking forgot-password (no DB connection)');
      const userExists = staticUsers.find(u => u.email === email);
      if (!userExists) return res.status(404).json({ message: 'No account found with this email (static).' });
      
      inMemoryResetCodes[email] = { code: resetCode, expire: resetCodeExpire };
    }

    // Send Code via Email (Both for DB and Mock)
    await sendResetCode(email, resetCode);
    res.json({ message: 'Verification code sent to your email.' });
    
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

// Verify Reset Code
app.post('/api/auth/verify-code', async (req, res) => {
  const { email, code } = req.body;
  try {
    if (isDBConnected()) {
      const user = await User.findOne({ 
        email,
        resetCode: code,
        resetCodeExpire: { $gt: Date.now() }
      });
      if (!user) return res.status(400).json({ message: 'Invalid or expired verification code.' });
    } else {
      const stored = inMemoryResetCodes[email];
      if (!stored || stored.code !== code || stored.expire < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired verification code (static).' });
      }
    }
    res.json({ message: 'Code verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Reset Password - Finalize with Code
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    if (isDBConnected()) {
      const user = await User.findOne({ 
        email,
        resetCode: code,
        resetCodeExpire: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired verification code.' });
      }

      user.password = newPassword;
      user.resetCode = undefined;
      user.resetCodeExpire = undefined;
      await user.save();
    } else {
      const stored = inMemoryResetCodes[email];
      if (!stored || stored.code !== code || stored.expire < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired verification code (static).' });
      }
      
      const user = staticUsers.find(u => u.email === email);
      if (user) {
        user.password = bcrypt.hashSync(newPassword, 10);
      }
      delete inMemoryResetCodes[email];
    }
    
    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
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
      // 1. Verify Stock
      for (const item of items) {
        // Support legacy numeric/string `id` values from static seed data by
        // attempting to match either `_id` (ObjectId) or the `id` field on the document.
        // Build a safe query: only query by _id if the value is a valid ObjectId
        const orQuery = [];
        if (mongoose.Types.ObjectId.isValid(item.id)) orQuery.push({ _id: item.id });
        orQuery.push({ id: item.id });
        const product = await Product.findOne(orQuery.length > 1 ? { $or: orQuery } : orQuery[0]);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.name} not found.` });
        }
        if (product.countInStock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}. Only ${product.countInStock} left.` });
        }
      }

      // 2. Deduct Stock
      for (const item of items) {
        // Resolve product by _id or legacy `id` field and update stock.
        const orQuery = [];
        if (mongoose.Types.ObjectId.isValid(item.id)) orQuery.push({ _id: item.id });
        orQuery.push({ id: item.id });
        const product = await Product.findOne(orQuery.length > 1 ? { $or: orQuery } : orQuery[0]);
        // If somehow product is missing here, skip (it was validated above)
        if (!product) continue;
        product.countInStock -= item.quantity;
        await product.save();
        // Normalize item id to the real ObjectId for the stored order
        item.id = product._id.toString();
      }

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
        order.status = 'paid';
        order.paymentResult = {
          id: req.body.id || 'payhere-tr-' + Date.now(),
          status: req.body.status || 'completed',
          update_time: req.body.update_time || new Date().toISOString(),
          email_address: req.body.payer?.email_address || '',
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

// PayHere webhook removed — PayPal integration in use instead.

// PayPal configuration endpoint (client id exposed to frontend)
app.get('/api/config/paypal', (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID || 'sb';
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  res.json({ clientId, sandbox: mode !== 'live' });
});

const getPayPalBase = () => (process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) throw new Error('PayPal credentials not configured');

  const tokenUrl = `${getPayPalBase()}/v1/oauth2/token`;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error('PayPal token request failed: ' + txt);
  }
  const data = await resp.json();
  return data.access_token;
}

// Create PayPal order (server-side)
app.post('/api/payments/paypal/create-order', async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) return res.status(400).json({ message: 'orderId and amount are required' });

    const token = await getPayPalAccessToken();
    const createUrl = `${getPayPalBase()}/v2/checkout/orders`;
    const body = {
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'USD', value: String(amount) } }],
      application_context: {
        brand_name: 'Plantopia',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`
      }
    };

    const resp = await fetch(createUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return res.status(500).json({ message: 'Failed to create PayPal order: ' + txt });
    }
    const data = await resp.json();
    res.json({ id: data.id, links: data.links });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Capture PayPal order (server-side)
app.post('/api/payments/paypal/capture-order', async (req, res) => {
  try {
    const { paypalOrderId } = req.body;
    if (!paypalOrderId) return res.status(400).json({ message: 'paypalOrderId is required' });

    const token = await getPayPalAccessToken();
    const capUrl = `${getPayPalBase()}/v2/checkout/orders/${paypalOrderId}/capture`;
    const resp = await fetch(capUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(500).json({ message: data.message || JSON.stringify(data) });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

// PayHere endpoints removed — PayPal handles online payments now.


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

// NOTE: server is started in connectDB() finally handler above.


