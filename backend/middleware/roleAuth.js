// Role-based authorization middleware
// Usage: roleAuth(['admin', 'staff'])

module.exports = (allowedRoles) => {
  return (req, res, next) => {
    // Get role from authenticated user
    const { role } = req.user;
    
    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ msg: 'Access denied. You do not have permission to access this resource.' });
    }
    
    next();
  };
}; 