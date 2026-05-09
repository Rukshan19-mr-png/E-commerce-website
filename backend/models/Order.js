const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    items: { type: Array, required: true },
    total: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    paymentMethod: { type: String, required: true, default: 'Cash on Delivery' },
    orderType: { type: String, default: 'Home Delivery' },
    status: { type: String, default: 'pending' },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    packedAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
