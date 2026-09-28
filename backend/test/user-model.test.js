const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { test } = require('node:test');
const User = require('../models/User');

const runSaveHooks = (user) => User.schema.s.hooks.execPre('save', user, []);

test('user save hook hashes a new password', async () => {
  const user = new User({
    name: 'Test Customer',
    email: 'test-customer@example.test',
    password: 'plain-text-password',
    role: 'user',
    phoneNumber: '0771234567',
  });

  await runSaveHooks(user);

  assert.notEqual(user.password, 'plain-text-password');
  assert.equal(await bcrypt.compare('plain-text-password', user.password), true);
});

test('user save hook leaves password unchanged when saving reset-code fields', async () => {
  const savedPassword = await bcrypt.hash('existing-password', 10);
  const user = User.hydrate({
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Customer',
    email: 'test-customer@example.test',
    password: savedPassword,
    role: 'user',
    phoneNumber: '0771234567',
  });
  user.resetCode = '123456';
  user.resetCodeExpire = new Date(Date.now() + 10 * 60 * 1000);

  await runSaveHooks(user);

  assert.equal(user.password, savedPassword);
  assert.equal(await bcrypt.compare('existing-password', user.password), true);
});
