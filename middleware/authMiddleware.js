const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.validateUser = async (request, h) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return h.response({ error: 'Unauthorized: No token provided' }).code(401).takeover();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);

    // Attach decoded data to request
    request.auth = {
      userId: decoded.user_id,
      role: decoded.role,
    };

    return h.continue;
  } catch (err) {
    console.error(err);
    return h.response({ error: 'Unauthorized: Invalid token' }).code(401).takeover();
  }
};
