const fs = require('fs');
const crypto = require('crypto');

const API_BASE = 'http://localhost:5000';

(async () => {
  try {
    // Read backend .env to get merchant config
    const envRaw = fs.readFileSync('backend/.env', 'utf8');
    const lines = envRaw.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }

    const merchantId = env.PAYHERE_MERCHANT_ID || '1236112';
    let merchantSecret = env.PAYHERE_MERCHANT_SECRET || '';

    // Detect base64 and decode if needed
    if (merchantSecret) {
      try {
        const decoded = Buffer.from(merchantSecret, 'base64').toString('utf8');
        const reencoded = Buffer.from(decoded, 'utf8').toString('base64');
        if (reencoded === merchantSecret) merchantSecret = decoded;
      } catch (e) {
        // keep raw
      }
    }

    console.log('Using merchantId:', merchantId);

    // 1) Create an order via API
    const orderBody = {
      userEmail: 'test@example.com',
      userName: 'Test User',
      items: [{ id: '1', name: 'Test Plant', quantity: 1 }],
      total: 1950, // subtotal, backend will add shipping if needed in mock
      subtotal: 1950,
      tax: 0,
      address: 'Test Address',
      phone: '0771234567',
      paymentMethod: 'PayHere Online',
      orderType: 'Home Delivery'
    };

    console.log('Creating mock order...');
    const createRes = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderBody)
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      console.error('Failed to create order:', createData);
      process.exit(1);
    }

    const order = createData.order;
    const orderId = order.id || order._id || orderId;
    console.log('Created order id:', orderId, 'total:', order.total || orderBody.total);

    const amount = (order.total || orderBody.total).toFixed ? (order.total || orderBody.total).toFixed(2) : Number(order.total || orderBody.total).toFixed(2);
    const currency = 'LKR';
    const status_code = '2'; // success

    // Build PayHere signature
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const hashInput = merchantId + orderId + amount + currency + status_code + hashedSecret;
    const md5sig = crypto.createHash('md5').update(hashInput).digest('hex').toUpperCase();

    console.log('Simulating PayHere IPN with md5sig:', md5sig);

    const ipnBody = {
      merchant_id: merchantId,
      order_id: orderId,
      payment_id: 'sim-' + Date.now(),
      payhere_amount: amount,
      payhere_currency: currency,
      status_code: status_code,
      md5sig: md5sig
    };

    const ipnRes = await fetch(`${API_BASE}/api/payments/payhere-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ipnBody)
    });

    const ipnText = await ipnRes.text();
    console.log('IPN response status:', ipnRes.status, 'body:', ipnText);

  } catch (err) {
    console.error('Error during simulation:', err);
    process.exit(1);
  }
})();
