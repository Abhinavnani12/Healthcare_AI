import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate user using JWT stored in cookies
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No session token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.status(401).json({ 
      success: false, 
      message: 'Session expired or invalid token. Please log in again.' 
    });
  }
};

/**
 * Middleware to authorize user based on role list
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication context missing.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. You do not have permissions to perform this action.' 
      });
    }

    next();
  };
};

/**
 * Middleware to verify that the user's account is active
 */
export const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'User authentication context missing.' 
    });
  }

  if (!req.user.isActive) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Account is deactivated. Please contact an administrator.' 
    });
  }

  next();
};
