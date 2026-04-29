const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    items: { type: Array, required: true },
    total: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    address: { type: String, required: true },
    status: { type: String, default: 'pending' },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
