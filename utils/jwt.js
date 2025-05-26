const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET 

exports.generateToken = (user) => {
  return jwt.sign(
    { id: user.user_id, role: user.role },
    SECRET,
    { expiresIn: '1d' } // token valid for 1 day
  );
};
