const mongoose = require('mongoose');
const dotenv = require('dotenv');
const users = require('./data/users');
const products = require('./data/products');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const importData = async () => {
  try {
    // Clear out any existing data to prevent duplicates
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    // Insert users (hooks will hash passwords automatically due to 'save' inside create)
    // Wait, Mongoose insertMany bypasses the 'save' middleware.
    // So we need to create users one by one or hash before insertMany. Let's hash them manually or run User.create.
    const createdUsers = await User.create(users);

    const adminUser = createdUsers[0]._id;

    // Attach admin user id as the creator of each product (if we added a user field to product later, 
    // for now we don't have a user field on Product, but it's common practice. I'll just insert as is.)
    const sampleProducts = products.map((product) => {
      return { ...product, /* user: adminUser */ };
    });

    await Product.insertMany(sampleProducts);

    console.log('🌱 Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error importing data: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('🗑️ Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
