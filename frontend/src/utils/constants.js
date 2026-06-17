const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl.endsWith('/api/') ? rawApiUrl.slice(0, -5) : rawApiUrl;
export const DELIVERY_FEE = 250;

export const ALLOWED_STAFF_EMAILS = [
  'abeywardenamr@gmail.com',
  'maleesharukshan19@gmail.com'
];

export const CATEGORIES = [
  'All',
  'Flower Plants',
  'Fruit Plants',
  'Other'
];

export const CURRENCY = 'Rs.';
export const LKR_TO_USD_RATE = 0.0033; // Approx 1 LKR = 0.0033 USD (300 LKR = 1 USD)
