// ============ AUTHENTICATION MIDDLEWARE ============
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const wardenAuth = (req, res, next) => {
    if (req.user && req.user.role === 'warden') {
        return next();
    }
    return res.status(403).json({ msg: 'Forbidden: Warden only' });
};

module.exports = authMiddleware;
module.exports.wardenAuth = wardenAuth;
