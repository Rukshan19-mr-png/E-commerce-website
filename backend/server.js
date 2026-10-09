const dns = require('dns');
// Set DNS servers to Google's public DNS to bypass local Windows DNS resolution issues for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Unable to set custom DNS servers:', e.message);
}

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
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Ensure database is connected for serverless invocations
app.use(async (req, res, next) => {
  if (process.env.MONGO_URI && !isDBConnected()) {
    try {
      await connectDB();
    } catch {
      // Keep non-payment API routes available with static fallback data.
    }
  }
  next();
});

// Attempt DB connection before starting server so logs reflect real state
let dbConnected = false;
connectDB()
  .then(() => { dbConnected = true; })
  .catch(() => { dbConnected = false; })
  .finally(() => {
    if (!process.env.VERCEL) {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`MongoDB connected: ${dbConnected}`);
      });
    }
  });


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

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Plantopia API! 🌿' });
});

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

const requireAuthenticatedCustomer = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required.' });
  }

  try {
    const customer = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || 'plantopia-secret');
    if (!customer.email) return res.status(401).json({ message: 'Invalid or expired token.' });
    req.paymentCustomer = customer;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

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
    const emailResult = await sendResetCode(email, resetCode);
    res.json({ 
      message: 'Verification code sent to your email.',
      previewUrl: emailResult?.previewUrl
    });
    
  } catch (error) {
    console.error('Forgot-password request failed:', error);
    res.status(500).json({ message: 'Unable to send a password reset code right now. Please try again later.' });
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

    if (paymentMethod === 'PayPal' || paymentMethod === 'PayPal Online') {
      return res.status(400).json({ message: 'Use the PayPal checkout endpoint to create online orders.' });
    }

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

// PayHere webhook removed — PayPal integration in use instead.

const getLkrToUsdRate = () => Number(process.env.LKR_TO_USD_RATE || 0.0033);

const restoreReservedStock = async (reservations) => {
  for (const reservation of reservations) {
    if (isDBConnected()) {
      await Product.updateOne({ _id: reservation.id }, { $inc: { countInStock: reservation.quantity } });
    } else {
      const product = await resolveProduct(reservation.id);
      if (product) product.countInStock += reservation.quantity;
    }
  }
};

const releasePayPalReservation = async (order, status = 'cancelled') => {
  if (!order.inventoryReserved) return;
  const reservations = order.items.map((item) => ({ id: item.id, quantity: item.quantity }));
  await restoreReservedStock(reservations);
  order.inventoryReserved = false;
  order.paymentExpiresAt = undefined;
  order.status = status;
  await persistOrder(order);
};

const expirePendingPayPalOrders = async () => {
  const now = new Date();
  const expiredOrders = isDBConnected()
    ? await Order.find({
      paymentMethod: 'PayPal',
      isPaid: false,
      inventoryReserved: true,
      paymentExpiresAt: { $lte: now },
    })
    : inMemoryOrders.filter((order) => (
      order.paymentMethod === 'PayPal'
      && !order.isPaid
      && order.inventoryReserved
      && order.paymentExpiresAt
      && order.paymentExpiresAt <= now
    ));

  for (const order of expiredOrders) await releasePayPalReservation(order);
};

// PayPal configuration endpoint (client id exposed to frontend)
app.get('/api/config/paypal', async (req, res) => {
  try {
    await expirePendingPayPalOrders();
  } catch (error) {
    console.error('PayPal reservation cleanup failed:', error.message);
    return res.status(500).json({ message: 'Could not prepare the PayPal checkout service.' });
  }
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  const persistentStorageAvailable = !process.env.VERCEL || isDBConnected();
  const configurationIssues = [];
  if (!clientId || !process.env.PAYPAL_CLIENT_SECRET) {
    configurationIssues.push('PayPal credentials are incomplete.');
  }
  if (!Number.isFinite(getLkrToUsdRate()) || getLkrToUsdRate() <= 0) {
    configurationIssues.push('The LKR-to-USD exchange rate is invalid.');
  }
  if (!persistentStorageAvailable) {
    configurationIssues.push('The payment database is not connected. Please retry shortly.');
  }
  const enabled = configurationIssues.length === 0;
  res.json({
    clientId,
    sandbox: mode !== 'live',
    enabled,
    lkrToUsdRate: enabled ? LKR_TO_USD_RATE : null,
    ...(enabled ? {} : { message: configurationIssues.join(' ') }),
  });
});

const getPayPalBase = () => (process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');
const LKR_TO_USD_RATE = getLkrToUsdRate();

const resolveProduct = async (id) => {
  if (isDBConnected()) {
    const queries = [];
    if (mongoose.Types.ObjectId.isValid(id)) queries.push({ _id: id });
    queries.push({ id });
    return Product.findOne(queries.length > 1 ? { $or: queries } : queries[0]);
  }
  return staticProducts.find((product) => product.id === String(id));
};

const saveOrder = async (orderData) => {
  if (isDBConnected()) return Order.create(orderData);
  const order = { ...orderData, id: `order-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`, createdAt: new Date() };
  inMemoryOrders.push(order);
  return order;
};

const findOrder = async (id) => {
  if (isDBConnected()) return mongoose.Types.ObjectId.isValid(id) ? Order.findById(id) : null;
  return inMemoryOrders.find((order) => order.id === id);
};

const persistOrder = async (order) => (isDBConnected() ? order.save() : order);

const requirePayPalConfig = (res) => {
  if (
    !process.env.PAYPAL_CLIENT_ID
    || !process.env.PAYPAL_CLIENT_SECRET
    || !Number.isFinite(LKR_TO_USD_RATE)
    || LKR_TO_USD_RATE <= 0
    || (process.env.VERCEL && !isDBConnected())
  ) {
    res.status(503).json({ message: 'PayPal is not configured. Check the backend PayPal credentials, exchange rate, and database connection.' });
    return false;
  }
  return true;
};

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
app.post('/api/payments/paypal/create-order', requireAuthenticatedCustomer, async (req, res) => {
  const reservations = [];
  let order;
  try {
    const { userEmail, userName, items, total, address, phone, orderType } = req.body;
    if (
      !userEmail
      || userEmail.toLowerCase() !== req.paymentCustomer.email.toLowerCase()
      || !userName
      || !Array.isArray(items)
      || !items.length
      || !Number.isFinite(total)
      || total <= 0
      || !phone
      || !address
      || (orderType && !['Home Delivery', 'Store Pickup'].includes(orderType))
    ) {
      return res.status(400).json({ message: 'Valid customer and order details are required.' });
    }
    if (!requirePayPalConfig(res)) return;
    await expirePendingPayPalOrders();

    let subtotal = 0;
    const verifiedItems = [];
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!item.id || !Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Each item needs a valid product id and quantity.' });
      const product = await resolveProduct(item.id);
      if (!product) return res.status(404).json({ message: `Product ${item.name || item.id} not found.` });
      if (product.countInStock < quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}. Only ${product.countInStock} left.` });
      subtotal += product.price * quantity;
      verifiedItems.push({ id: isDBConnected() ? product._id.toString() : product.id, name: product.name, price: product.price, quantity, image: product.image });
    }
    if (Math.round(total) !== Math.round(subtotal)) return res.status(400).json({ message: 'Cart total does not match current product prices.' });

    const shipping = orderType === 'Store Pickup' ? 0 : DELIVERY_FEE;
    const grandTotal = subtotal + shipping;
    const amount = (grandTotal * LKR_TO_USD_RATE).toFixed(2);
    if (Number(amount) <= 0) return res.status(400).json({ message: 'Order total must be greater than zero.' });

    // Check all stock before deducting any.
    for (const item of verifiedItems) {
      const product = await resolveProduct(item.id);
      if (!product || product.countInStock < item.quantity) return res.status(409).json({ message: `Stock changed for ${item.name}. Please review your cart.` });
    }
    for (const item of verifiedItems) {
      const product = await resolveProduct(item.id);
      if (isDBConnected()) {
        const updated = await Product.updateOne({ _id: product._id, countInStock: { $gte: item.quantity } }, { $inc: { countInStock: -item.quantity } });
        if (updated.modifiedCount !== 1) {
          await restoreReservedStock(reservations);
          return res.status(409).json({ message: `Stock changed for ${item.name}. Please review your cart.` });
        }
        reservations.push({ id: product._id, quantity: item.quantity });
      } else {
        product.countInStock -= item.quantity;
        reservations.push({ id: product.id, quantity: item.quantity });
      }
    }

    order = await saveOrder({
      userEmail: req.paymentCustomer.email,
      userName,
      items: verifiedItems,
      total: grandTotal,
      shipping,
      tax: 0,
      address,
      paymentMethod: 'PayPal',
      orderType: orderType || 'Home Delivery',
      phone,
      status: 'pending',
      isPaid: false,
      inventoryReserved: true,
      paymentExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const token = await getPayPalAccessToken();
    const savedOrderId = order._id ? order._id.toString() : order.id;
    const createUrl = `${getPayPalBase()}/v2/checkout/orders`;
    const body = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: savedOrderId,
        custom_id: savedOrderId,
        invoice_id: savedOrderId,
        amount: { currency_code: 'USD', value: amount },
      }],
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
      throw new Error(`PayPal order creation failed with status ${resp.status}`);
    }
    const data = await resp.json();
    if (!data.id) throw new Error('PayPal did not return an order id');
    order.paypalOrderId = data.id;
    await persistOrder(order);
    res.json({ id: data.id, orderId: savedOrderId, amount, currency: 'USD' });
  } catch (error) {
    console.error('PayPal create order failed:', error.message);
    try {
      await restoreReservedStock(reservations);
      if (order) {
        if (isDBConnected()) await Order.deleteOne({ _id: order._id });
        else {
          const orderIndex = inMemoryOrders.indexOf(order);
          if (orderIndex !== -1) inMemoryOrders.splice(orderIndex, 1);
        }
      }
    } catch (cleanupError) {
      console.error('PayPal order cleanup failed:', cleanupError.message);
    }
    if (!res.headersSent) {
      res.status(500).json({ message: 'Could not create PayPal checkout. Please try again.' });
    }
  }
});

app.post('/api/payments/paypal/cancel-order', requireAuthenticatedCustomer, async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;
    if (!paypalOrderId || !orderId) return res.status(400).json({ message: 'paypalOrderId and orderId are required.' });
    if (!requirePayPalConfig(res)) return;
    const order = await findOrder(orderId);
    if (!order || order.userEmail.toLowerCase() !== req.paymentCustomer.email.toLowerCase()) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.paymentMethod !== 'PayPal' || order.paypalOrderId !== paypalOrderId) {
      return res.status(400).json({ message: 'PayPal order does not match this checkout.' });
    }
    if (order.isPaid) return res.status(409).json({ message: 'A completed payment cannot be cancelled.' });
    await releasePayPalReservation(order);
    res.json({ cancelled: true });
  } catch (error) {
    console.error('PayPal cancellation failed:', error.message);
    res.status(500).json({ message: 'Could not cancel this PayPal checkout. Please contact support if payment was taken.' });
  }
});

// Capture PayPal order (server-side)
app.post('/api/payments/paypal/capture-order', requireAuthenticatedCustomer, async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;
    if (!paypalOrderId || !orderId) return res.status(400).json({ message: 'paypalOrderId and orderId are required.' });
    if (!requirePayPalConfig(res)) return;
    await expirePendingPayPalOrders();
    const order = await findOrder(orderId);
    if (!order || order.userEmail.toLowerCase() !== req.paymentCustomer.email.toLowerCase()) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.paymentMethod !== 'PayPal' || order.paypalOrderId !== paypalOrderId) {
      return res.status(400).json({ message: 'PayPal order does not match this checkout.' });
    }
    if (order.isPaid) {
      return res.json({ id: paypalOrderId, status: 'COMPLETED', orderId });
    }
    if (!order.inventoryReserved || order.status === 'cancelled') {
      return res.status(409).json({ message: 'This PayPal checkout has expired. Please start checkout again.' });
    }

    const token = await getPayPalAccessToken();
    const capUrl = `${getPayPalBase()}/v2/checkout/orders/${paypalOrderId}/capture`;
    const resp = await fetch(capUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${orderId}-capture`,
      }
    });
    let data;
    try {
      data = await resp.json();
    } catch {
      throw new Error(`PayPal capture returned an invalid response (status ${resp.status})`);
    }
    if (!resp.ok) {
      console.error('PayPal capture request failed:', data.message || resp.status);
      return res.status(502).json({ message: 'PayPal could not confirm this payment. Please retry or contact support.' });
    }
    const purchaseUnit = data.purchase_units?.find((unit) => unit.custom_id === String(orderId));
    const capture = purchaseUnit?.payments?.captures?.[0];
    const expectedAmount = (Number(order.total) * LKR_TO_USD_RATE).toFixed(2);
    if (
      data.status !== 'COMPLETED'
      || capture?.status !== 'COMPLETED'
      || capture?.amount?.currency_code !== 'USD'
      || capture?.amount?.value !== expectedAmount
      || !purchaseUnit
      || !capture.id
    ) {
      return res.status(400).json({ message: 'PayPal capture details did not match this order.' });
    }
    order.isPaid = true;
    order.inventoryReserved = false;
    order.paymentExpiresAt = undefined;
    order.paidAt = new Date();
    order.status = 'paid';
    order.paymentResult = {
      id: capture.id,
      status: capture.status,
      update_time: capture.update_time || data.update_time || new Date().toISOString(),
      email_address: data.payer?.email_address || '',
    };
    await persistOrder(order);
    notifyOrderConfirmed(order).catch((err) => console.error('Notification Error:', err));
    res.json(data);
  } catch (error) {
    console.error('PayPal capture failed:', error.message);
    res.status(500).json({ message: 'Could not confirm PayPal payment. Please retry or contact support.' });
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

module.exports = app;
