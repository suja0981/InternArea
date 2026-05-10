const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET env var not set'); })();

const adminMiddleware = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No admin token provided.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Not an admin.' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
    }
};

module.exports = adminMiddleware;
