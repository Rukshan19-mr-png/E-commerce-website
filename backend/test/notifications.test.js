const assert = require('node:assert/strict');
const { test } = require('node:test');
const { sendResetCode } = require('../utils/notifications');

test('production password reset refuses test mail when real email credentials are missing', async () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const vercel = process.env.VERCEL;

  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;
  process.env.VERCEL = '1';

  try {
    const result = await sendResetCode('customer@example.test', '123456');
    assert.equal(result.success, false);
    assert.match(result.error, /EMAIL_USER and EMAIL_PASS/);

    process.env.EMAIL_USER = 'customer@gmail.com';
    const missingPassword = await sendResetCode('customer@example.test', '123456');
    assert.equal(missingPassword.success, false);
    assert.match(missingPassword.error, /EMAIL_PASS/);

    process.env.EMAIL_PASS = 'your-16-char-app-password';
    const placeholderPassword = await sendResetCode('customer@example.test', '123456');
    assert.equal(placeholderPassword.success, false);
    assert.match(placeholderPassword.error, /EMAIL_PASS/);
  } finally {
    if (emailUser === undefined) delete process.env.EMAIL_USER;
    else process.env.EMAIL_USER = emailUser;
    if (emailPass === undefined) delete process.env.EMAIL_PASS;
    else process.env.EMAIL_PASS = emailPass;
    if (vercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = vercel;
  }
});
