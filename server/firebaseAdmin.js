const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let isInitialized = false;

try {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isInitialized = true;
        console.log("Firebase Admin Initialized Successfully.");
    } else {
        console.warn("\n[WARNING] Firebase Admin SDK is NOT initialized.");
        console.warn("Please add 'serviceAccountKey.json' to the server folder to enable Security Middlewares and Password Reset.\n");
    }
} catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
}

module.exports = { admin, isInitialized };
