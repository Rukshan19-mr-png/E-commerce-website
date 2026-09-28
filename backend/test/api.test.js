const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { test } = require('node:test');
const request = require('supertest');

process.env.MONGO_URI = '';
process.env.JWT_SECRET = 'plantopia-unit-test-secret';
process.env.VERCEL = '1';

let resetCode;
const resetRecipients = [];
let resetEmailResult = { success: true, previewUrl: 'https://example.test/reset-preview' };
const notificationsPath = path.resolve(__dirname, '../utils/notifications.js');
const notificationsModule = new Module(notificationsPath, module);
notificationsModule.exports = {
  notifyOrderConfirmed: async () => {},
  notifyOrderDelivered: async () => {},
  sendResetCode: async (email, code) => {
    resetRecipients.push(email);
    resetCode = code;
    return resetEmailResult;
  },
};
notificationsModule.loaded = true;
require.cache[notificationsPath] = notificationsModule;

const app = require('../server');

test('API feature flows work with the in-memory fallback', async (t) => {
  let customerEmail;
  let customerToken;
  let staffToken;
  let deliveryOrderId;

  await t.test('health, product catalog, and PayPal configuration', async () => {
    const health = await request(app).get('/api');
    assert.equal(health.status, 200);
    assert.match(health.body.message, /Plantopia API/);

    const allowedOrigin = await request(app).get('/api').set('Origin', 'http://localhost:5173');
    assert.equal(allowedOrigin.headers['access-control-allow-origin'], 'http://localhost:5173');
    const untrustedOrigin = await request(app).get('/api').set('Origin', 'https://untrusted.vercel.app');
    assert.equal(untrustedOrigin.headers['access-control-allow-origin'], undefined);

    const catalog = await request(app).get('/api/products');
    assert.equal(catalog.status, 200);
    assert.ok(catalog.body.length > 0);

    const product = await request(app).get('/api/products/1');
    assert.equal(product.status, 200);
    assert.equal(product.body.id, '1');
    assert.equal((await request(app).get('/api/products/not-found')).status, 404);

    const paypalConfig = await request(app).get('/api/config/paypal');
    assert.deepEqual(paypalConfig.body, { clientId: 'sb', sandbox: true });
    assert.equal((await request(app).post('/api/payments/paypal/create-order').send({})).status, 400);
    assert.equal((await request(app).post('/api/payments/paypal/capture-order').send({})).status, 400);

    const dbStatus = await request(app).get('/api/debug/db');
    assert.deepEqual(dbStatus.body, { connected: false });
  });

  await t.test('signup validation, login, and current-user authentication', async () => {
    const invalidEmail = await request(app).post('/api/auth/signup').send({
      name: 'Invalid', email: 'not-an-email', password: 'password123', role: 'user', phoneNumber: '0771234567',
    });
    assert.equal(invalidEmail.status, 400);

    const invalidPhone = await request(app).post('/api/auth/signup').send({
      name: 'Invalid', email: 'invalid-phone@example.test', password: 'password123', role: 'user', phoneNumber: '123',
    });
    assert.equal(invalidPhone.status, 400);

    const unauthorizedStaff = await request(app).post('/api/auth/signup').send({
      name: 'Unauthorized', email: 'staff@example.test', password: 'password123', role: 'seller', phoneNumber: '0771234567',
    });
    assert.equal(unauthorizedStaff.status, 403);

    customerEmail = `unit-${Date.now()}@example.test`;
    const signup = await request(app).post('/api/auth/signup').send({
      name: 'Unit Test Customer',
      email: customerEmail,
      password: 'password123',
      role: 'user',
      phoneNumber: '0771234567',
    });
    assert.equal(signup.status, 201);
    assert.equal(signup.body.user.email, customerEmail);
    assert.equal(Object.hasOwn(signup.body.user, 'password'), false);

    const invalidLogin = await request(app).post('/api/auth/login').send({
      email: customerEmail, password: 'incorrect-password',
    });
    assert.equal(invalidLogin.status, 401);

    const login = await request(app).post('/api/auth/login').send({
      email: customerEmail, password: 'password123',
    });
    assert.equal(login.status, 200);
    customerToken = login.body.token;
    assert.ok(customerToken);

    assert.equal((await request(app).get('/api/auth/me')).status, 401);
    const currentUser = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${customerToken}`);
    assert.equal(currentUser.status, 200);
    assert.equal(currentUser.body.user.email, customerEmail);
  });

  await t.test('password reset rejects invalid codes and accepts a current code', async () => {
    const recipientsBeforeUnknownAddress = resetRecipients.length;
    const unknownAddress = await request(app).post('/api/auth/forgot-password').send({
      email: 'not-registered@example.test',
    });
    assert.equal(unknownAddress.status, 404);
    assert.equal(resetRecipients.length, recipientsBeforeUnknownAddress);

    resetEmailResult = { success: false, error: 'Mail provider rejected the message.' };
    const failedDelivery = await request(app).post('/api/auth/forgot-password').send({
      email: `  ${customerEmail.toUpperCase()}  `,
    });
    assert.equal(failedDelivery.status, 503);
    assert.match(failedDelivery.body.message, /could not send/i);
    assert.equal(resetRecipients.at(-1), customerEmail);
    assert.equal((await request(app).post('/api/auth/verify-code').send({
      email: customerEmail, code: resetCode,
    })).status, 400);

    resetEmailResult = { success: true, previewUrl: 'https://example.test/reset-preview' };
    const forgotPassword = await request(app).post('/api/auth/forgot-password').send({ email: customerEmail });
    assert.equal(forgotPassword.status, 200);
    assert.ok(resetCode);
    assert.equal(resetRecipients.at(-1), customerEmail);

    assert.equal((await request(app).post('/api/auth/verify-code').send({
      email: customerEmail, code: '000000',
    })).status, 400);
    assert.equal((await request(app).post('/api/auth/verify-code').send({
      email: customerEmail, code: resetCode,
    })).status, 200);

    const reset = await request(app).post('/api/auth/reset-password').send({
      email: customerEmail, code: resetCode, newPassword: 'new-password-123',
    });
    assert.equal(reset.status, 200);
    assert.equal((await request(app).post('/api/auth/login').send({
      email: customerEmail, password: 'password123',
    })).status, 401);
    assert.equal((await request(app).post('/api/auth/login').send({
      email: customerEmail, password: 'new-password-123',
    })).status, 200);
  });

  await t.test('orders validate items, enforce offline stock, and distinguish delivery from pickup', async () => {
    const orderBase = {
      userEmail: customerEmail,
      userName: 'Unit Test Customer',
      total: 1250,
      address: 'Test address',
      phone: '0771234567',
      items: [{ id: '1', name: 'Kadupul', price: 1250, quantity: 1 }],
    };

    assert.equal((await request(app).post('/api/orders').send({
      ...orderBase, items: [],
    })).status, 400);
    assert.equal((await request(app).post('/api/orders').send({
      ...orderBase, items: [{ id: '1', quantity: 0 }],
    })).status, 400);
    assert.equal((await request(app).post('/api/orders').send({
      ...orderBase, total: -1,
    })).status, 400);
    assert.equal((await request(app).post('/api/orders').send({
      ...orderBase,
      items: [
        { id: '2', name: 'Vesak Orchid', quantity: 3 },
        { id: '2', name: 'Vesak Orchid', quantity: 3 },
      ],
    })).status, 400);

    const deliveryOrder = await request(app).post('/api/orders').send(orderBase);
    assert.equal(deliveryOrder.status, 201);
    deliveryOrderId = deliveryOrder.body.order.id;
    assert.equal(deliveryOrder.body.order.shipping, 250);
    assert.equal(deliveryOrder.body.order.total, 1500);
    assert.equal(deliveryOrder.body.order.address, orderBase.address);

    const pickupOrder = await request(app).post('/api/orders').send({
      ...orderBase,
      orderType: 'Store Pickup',
    });
    assert.equal(pickupOrder.status, 201);
    assert.equal(pickupOrder.body.order.shipping, 0);
    assert.equal(pickupOrder.body.order.total, 1250);

    const oversoldOrder = await request(app).post('/api/orders').send(orderBase);
    assert.equal(oversoldOrder.status, 400);
    assert.match(oversoldOrder.body.message, /Insufficient stock/);

    const catalog = await request(app).get('/api/products');
    assert.equal(catalog.body.find(product => product.id === '1').countInStock, 0);
  });

  await t.test('order access, payment, staff status, and stock management', async () => {
    const customerOrders = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`);
    assert.equal(customerOrders.status, 200);
    assert.equal(customerOrders.body.orders.length, 2);
    assert.equal((await request(app).get('/api/orders').set('Authorization', 'Bearer invalid')).status, 401);

    const paidOrder = await request(app).put(`/api/orders/${deliveryOrderId}/pay`).send({
      id: 'test-payment', status: 'completed',
    });
    assert.equal(paidOrder.status, 200);
    assert.equal(paidOrder.body.isPaid, true);
    assert.equal(paidOrder.body.status, 'paid');

    assert.equal((await request(app).put(`/api/orders/${deliveryOrderId}/status`).send({
      status: 'packing',
    })).status, 401);
    assert.equal((await request(app).put(`/api/orders/${deliveryOrderId}/status`)
      .set('Authorization', `Bearer ${customerToken}`).send({ status: 'packing' })).status, 403);

    const staffLogin = await request(app).post('/api/auth/login').send({
      email: 'abeywardenamr@gmail.com', password: 'password123',
    });
    assert.equal(staffLogin.status, 200);
    staffToken = staffLogin.body.token;

    const statusUpdate = await request(app).put(`/api/orders/${deliveryOrderId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'delivered' });
    assert.equal(statusUpdate.status, 200);
    assert.equal(statusUpdate.body.order.status, 'delivered');
    assert.ok(statusUpdate.body.order.deliveredAt);

    const product = await request(app).get('/api/products/3');
    const originalStock = product.body.countInStock;
    const stockUpdate = await request(app).put('/api/products/3/stock')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ countInStock: 7 });
    assert.equal(stockUpdate.status, 200);
    assert.equal(stockUpdate.body.product.countInStock, 7);
    assert.equal((await request(app).put('/api/products/3/stock')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ countInStock: -1 })).status, 400);
    await request(app).put('/api/products/3/stock')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ countInStock: originalStock });
  });
});
