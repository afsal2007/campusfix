import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to protect routes that require authentication
 */
export const protect = async (req, res, next) => {
  let token;

  // Check for Authorization header starting with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id from decoded token payload (excluding password)
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          message: 'Not authorized, user no longer exists',
        });
      }

      // Attach user object to request
      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({
        message: 'Not authorized, invalid or expired token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token provided',
    });
  }
};
