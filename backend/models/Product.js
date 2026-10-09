const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a plant name'],
      trim: true,
      maxLength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      default: 0.0
    },
    image: {
      type: String,
      required: [true, 'Please add an image URL'],
      default: '/images/sample-plant.jpg'
    },
    images: {
      type: [String],
      default: []
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0
    },
    // Special features for our Unique Plant Shop Topic
    lightRequirement: {
      type: String,
      required: true,
      enum: ['Low Light', 'Partial Sun', 'Bright Indirect', 'Direct Sun'],
      default: 'Bright Indirect'
    },
    petFriendly: {
      type: Boolean,
      required: true,
      default: false
    },
    wateringFrequency: {
      type: String,
      required: true,
      enum: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'],
      default: 'Weekly'
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['Flower Plants', 'Fruit Plants', 'Other']
    }
  },
  {
    timestamps: true, // Automatically creates 'createdAt' and 'updatedAt' fields
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
