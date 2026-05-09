const nodemailer = require('nodemailer');

// Configure Email Transporter
// NOTE: For real usage, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

/**
 * Send Email Notification
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: '"Plantopia Sri Lanka" <noreply@plantopia.lk>',
      to,
      subject,
      text,
      html
    });
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('Email Error:', error.message);
  }
};

/**
 * Send SMS Notification
 */
const sendSMS = async (phone, message) => {
  try {
    const sid = process.env.TWILIO_SID;
    const auth = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (sid && auth && from) {
      const client = require('twilio')(sid, auth);
      await client.messages.create({
        body: message,
        from: from,
        to: phone.startsWith('+') ? phone : `+94${phone.startsWith('0') ? phone.slice(1) : phone}` // Default to SL prefix
      });
      console.log(`Real SMS sent to ${phone}`);
    } else {
      console.log(`[SMS MOCK] To ${phone}: ${message}`);
      console.log(`(Configure TWILIO_SID in .env to send real SMS)`);
    }
  } catch (error) {
    console.error('SMS Error:', error.message);
  }
};

/**
 * Notify Order Confirmed
 */
const notifyOrderConfirmed = async (order) => {
  const subject = `Order Confirmed - #${order._id.toString().slice(-6).toUpperCase()}`;
  const message = `Hello ${order.userName}, your order #${order._id.toString().slice(-6).toUpperCase()} has been confirmed. Total: Rs. ${order.total.toLocaleString()}. Thank you for shopping with Plantopia!`;
  
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1b4332;">
      <h2>Order Confirmed! 🌿</h2>
      <p>Hello ${order.userName},</p>
      <p>Your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been successfully placed and is being processed.</p>
      <p><strong>Total Amount:</strong> Rs. ${order.total.toLocaleString()}</p>
      <p><strong>Delivery Address:</strong> ${order.address}</p>
      <hr />
      <p>Thank you for choosing Plantopia!</p>
    </div>
  `;

  await sendEmail(order.userEmail, subject, message, html);
  await sendSMS(order.phone, message);
};

/**
 * Notify Order Delivered
 */
const notifyOrderDelivered = async (order) => {
  const subject = `Order Delivered! - #${order._id.toString().slice(-6).toUpperCase()}`;
  const message = `Hello ${order.userName}, your order #${order._id.toString().slice(-6).toUpperCase()} has been delivered successfully. We hope you love your new plants!`;
  
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1b4332;">
      <h2>Order Delivered! 🎉</h2>
      <p>Hello ${order.userName},</p>
      <p>Good news! Your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been delivered.</p>
      <p>We hope your new plants bring joy to your space. If you have any questions about care, check our Care Guides on the website.</p>
      <hr />
      <p>Thank you for shopping with Plantopia!</p>
    </div>
  `;

  await sendEmail(order.userEmail, subject, message, html);
  await sendSMS(order.phone, message);
};

module.exports = {
  notifyOrderConfirmed,
  notifyOrderDelivered
};
