const { connect } = require('mongoose');

const maskUriCredentials = (uri) => {
  return uri.replace(/\/\/(.*@)/, '//***@');
};

const extractHostInfo = (uri) => {
  try {
    const m = uri.match(/@([^/?]+)/);
    if (m && m[1]) return m[1];
    const afterProto = uri.split('//')[1];
    return afterProto.split('/')[0];
  } catch (e) {
    return uri;
  }
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGO_URI is not defined. Skipping MongoDB connection.');
    return Promise.resolve(false);
  }

  const masked = maskUriCredentials(uri);
  const hostInfo = extractHostInfo(uri);
  console.log(`Attempting MongoDB connection to: ${hostInfo} (credentials masked: ${masked})`);

  try {
    const conn = await connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.warn('Continuing without MongoDB. API routes will still work from static data.');
    if (error.message && error.message.toLowerCase().includes('whitelist')) {
      console.warn('If you are using MongoDB Atlas, ensure your current IP is added to the Cluster Network Access IP list.');
    }
    return Promise.reject(error);
  }
};

module.exports = connectDB;
