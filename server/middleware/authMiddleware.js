const { admin, isInitialized } = require('../firebaseAdmin');

const authMiddleware = async (req, res, next) => {
    // If Admin SDK isn't configured, bypass for prototyping, but warn.
    if (!isInitialized) {
        console.warn("[WARNING] Bypassing Auth Middleware. Firebase Admin not configured.");
        
        // Mock req.user based on req.body for fallback during testing without serviceAccountKey
        req.user = { uid: req.body.uid || req.body.authorUid };
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;
