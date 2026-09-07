/**
 * Middleware to restrict access based on user roles
 * @param {...String} roles Allowed roles (e.g. 'student', 'faculty', 'admin')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authorized, user identity missing',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    return next();
  };
};
