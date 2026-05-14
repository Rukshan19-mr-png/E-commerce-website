const bcrypt = require('bcryptjs');

const users = [
  {
    name: 'Manager (M.R. Abeywardena)',
    email: 'abeywardenamr@gmail.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'manager',
    phoneNumber: '+94712345678',
    id: 'manager-001',
  },
  {
    name: 'Manager (Maleesha Rukshan)',
    email: 'maleesharukshan19@gmail.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'manager',
    phoneNumber: '+94712345679',
    id: 'manager-002',
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'user',
    phoneNumber: '+94712345680',
    id: 'user-001',
  },
  {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'user',
    phoneNumber: '+94712345681',
    id: 'user-002',
  },
];

module.exports = users;
