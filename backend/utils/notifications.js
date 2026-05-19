const nodemailer = require('nodemailer');

// Helper to get order ID string — handles both DB (_id) and in-memory (id) orders
const getOrderRef = (order) => {
  const rawId = order._id || order.id || 'N/A';
  const str = rawId.toString();
  return str.slice(-6).toUpperCase();
};

// Only create transporter if SMTP credentials are configured
const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return user && pass && !user.includes('your-email') && !pass.includes('your-app-password');
};

const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send Email Notification (skips gracefully if credentials not configured)
 */
const sendEmail = async (to, subject, text, html) => {
  if (!isEmailConfigured()) {
    console.log(`[EMAIL MOCK - no SMTP config] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from: `"Plantopia Sri Lanka" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('Email Error:', error.message);
  }
};

/**
 * Send SMS Notification (skips gracefully if Twilio not configured)
 */
const sendSMS = async (phone, message) => {
  try {
    const sid = process.env.TWILIO_SID;
    const auth = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (sid && auth && from && !sid.includes('your_twilio')) {
      const client = require('twilio')(sid, auth);
      const toNumber = phone.startsWith('+') ? phone : `+94${phone.startsWith('0') ? phone.slice(1) : phone}`;
      await client.messages.create({ body: message, from, to: toNumber });
      console.log(`SMS sent to ${phone}`);
    } else {
      console.log(`[SMS MOCK - no Twilio config] To ${phone}: ${message}`);
    }
  } catch (error) {
    console.error('SMS Error:', error.message);
  }
};

/**
 * Notify Order Confirmed — works with DB and in-memory orders
 */
const notifyOrderConfirmed = async (order) => {
  const ref = getOrderRef(order);
  const subject = `Order Confirmed - #${ref}`;
  const message = `Hello ${order.userName}, your order #${ref} has been confirmed. Total: Rs. ${order.total.toLocaleString()}. Thank you for shopping with Plantopia!`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1b4332; max-width: 600px; margin: auto;">
      <h2 style="color: #2d6a4f;">Order Confirmed! 🌿</h2>
      <p>Hello <strong>${order.userName}</strong>,</p>
      <p>Your order <strong>#${ref}</strong> has been successfully placed and is being processed.</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #5c6c5d;">Total Amount</td><td style="padding: 8px; font-weight: bold;">Rs. ${order.total.toLocaleString()}</td></tr>
        <tr><td style="padding: 8px; color: #5c6c5d;">Payment Method</td><td style="padding: 8px;">${order.paymentMethod || 'Cash on Delivery'}</td></tr>
        <tr><td style="padding: 8px; color: #5c6c5d;">Delivery Address</td><td style="padding: 8px;">${order.address || 'N/A'}</td></tr>
      </table>
      <hr style="border: none; border-top: 1px solid #d8f3dc;" />
      <p style="color: #5c6c5d; font-size: 0.9rem;">Thank you for choosing Plantopia Sri Lanka! 🌱</p>
    </div>
  `;

  await sendEmail(order.userEmail, subject, message, html);
  if (order.phone) await sendSMS(order.phone, message);
};

/**
 * Notify Order Delivered — works with DB and in-memory orders
 */
const notifyOrderDelivered = async (order) => {
  const ref = getOrderRef(order);
  const subject = `Order Delivered! - #${ref}`;
  const message = `Hello ${order.userName}, your order #${ref} has been delivered successfully. We hope you love your new plants!`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1b4332; max-width: 600px; margin: auto;">
      <h2 style="color: #2d6a4f;">Order Delivered! 🎉</h2>
      <p>Hello <strong>${order.userName}</strong>,</p>
      <p>Great news! Your order <strong>#${ref}</strong> has been delivered.</p>
      <p>We hope your new plants bring joy to your space. Check our <strong>Care Guides</strong> on the website for tips on keeping them healthy.</p>
      <hr style="border: none; border-top: 1px solid #d8f3dc;" />
      <p style="color: #5c6c5d; font-size: 0.9rem;">Thank you for shopping with Plantopia Sri Lanka! 🌱</p>
    </div>
  `;

  await sendEmail(order.userEmail, subject, message, html);
  if (order.phone) await sendSMS(order.phone, message);
};

/**
 * Send Password Reset Code
 */
const sendResetCode = async (email, code) => {
  const subject = 'Password Reset Verification Code - Plantopia';
  const message = `Your password reset verification code is: ${code}. This code will expire in 10 minutes.`;

  console.log(`[RESET CODE] To: ${email} | Code: ${code}`);

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1b4332; max-width: 500px; margin: auto; border: 1px solid #d8f3dc; border-radius: 12px;">
      <h2 style="text-align: center; color: #2d6a4f;">Password Reset 🌿</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Use the verification code below:</p>
      <div style="background: #f4fcf6; padding: 20px; text-align: center; font-size: 2rem; font-weight: 800; letter-spacing: 8px; color: #1b4332; border-radius: 8px; margin: 20px 0; border: 2px dashed #2d6a4f;">
        ${code}
      </div>
      <p style="font-size: 0.9rem; color: #5c6c5d;">This code will expire in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #d8f3dc; margin: 20px 0;" />
      <p style="text-align: center; font-size: 0.8rem; color: #5c6c5d;">Plantopia Sri Lanka — Bring Life to Your Space</p>
    </div>
  `;

  await sendEmail(email, subject, message, html);
};

module.exports = { notifyOrderConfirmed, notifyOrderDelivered, sendResetCode };
