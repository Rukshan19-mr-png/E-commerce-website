const app = require('../server.js');

module.exports = (req, res) => {
  return app(req, res, (err) => {
    if (err) {
      console.error('Unhandled error:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
};
