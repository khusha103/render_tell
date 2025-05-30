// module.exports = function (req, res, next) {
//   if (req.user && req.user.role === 'admin') {
//     next();
//   } else {
//     res.status(403).json({ message: 'Forbidden: Admins only' });
//   }
// };


const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mock_jwt_secret'); // fallback
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admins only.' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token.' });
  }
};
