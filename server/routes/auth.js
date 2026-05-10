const express = require('express');
const router = express.Router();
const PasswordReset = require('../models/PasswordReset');
const { admin, isInitialized } = require('../firebaseAdmin');

// Helper to check if dates are same day
const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

// Helper to generate a random password (only letters)
const generatePassword = (length = 10) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
};

router.post('/forgot-password', async (req, res) => {
    try {
        const raw = req.body.identifier;

        if (!raw || !raw.trim()) {
            return res.status(400).json({ error: "Email or phone number is required" });
        }

        // Normalize: trim whitespace, lowercase for emails
        const identifier = raw.trim().toLowerCase();

        // Basic format validation: must look like an email or an all-digit phone
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const isPhone = /^[0-9]{7,15}$/.test(identifier);
        if (!isEmail && !isPhone) {
            return res.status(400).json({ error: "Please enter a valid email address or phone number." });
        }

        // Check if a reset request was already made today
        let resetRecord = await PasswordReset.findOne({ identifier });
        const today = new Date();

        if (resetRecord) {
            if (isSameDay(resetRecord.lastResetDate, today)) {
                return res.status(429).json({ 
                    error: "You can use this option only once per day." 
                });
            }
            resetRecord.lastResetDate = today;
            await resetRecord.save();
        } else {
            resetRecord = new PasswordReset({ identifier, lastResetDate: today });
            await resetRecord.save();
        }

        // Generate a 12-character alphabetic-only password (uppercase + lowercase)
        const newPassword = generatePassword(12);

        // Update password in Firebase Auth
        if (!isInitialized) {
            return res.status(500).json({ error: "Firebase Admin is not configured. Cannot update password. Please add serviceAccountKey.json to the server." });
        }

        try {
            let userRecord;
            if (isEmail) {
                userRecord = await admin.auth().getUserByEmail(identifier);
            } else {
                // Ensure phone number has country code for Firebase
                let phoneStr = identifier.startsWith('+') ? identifier : `+91${identifier}`; // Assuming India default
                userRecord = await admin.auth().getUserByPhoneNumber(phoneStr);
            }

            await admin.auth().updateUser(userRecord.uid, {
                password: newPassword
            });

        } catch (firebaseErr) {
            console.error("Firebase Update Error:", firebaseErr);
            if (firebaseErr.code === 'auth/user-not-found') {
                 return res.status(404).json({ error: "No account found with this email/phone number." });
            }
            return res.status(500).json({ error: "Failed to update password in Firebase." });
        }

        // Return the new password to the user
        res.status(200).json({
            message: "Your new password has been generated and updated successfully. Please log in.",
            newPassword
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

const LoginHistory = require('../models/LoginHistory');
const User = require('../models/User');

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Track Login Attempt
router.post('/track-login', async (req, res) => {
    try {
        const { uid, email, browser, os, deviceType, ipAddress } = req.body;
        
        let status = 'Success';
        let otpRequired = false;

        if (deviceType === 'Mobile') {
            const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric' };
            const istHour = parseInt(new Date().toLocaleString('en-US', options), 10);
            // Allow only between 10:00 AM and 1:00 PM IST (hours 10, 11, 12)
            if (istHour < 10 || istHour >= 13) {
                return res.status(403).json({ error: "Mobile login is only allowed between 10:00 AM and 1:00 PM IST." });
            }
        }

        // If Google Chrome, force OTP
        if (browser === 'Chrome') {
            status = 'Pending OTP';
            otpRequired = true;
            
            // Generate OTP
            const otp = generateOTP();
            let user = await User.findOne({ uid });
            if (!user) {
                user = new User({ uid, email });
            }
            user.currentOtp = otp;
            user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // expires in 10 minutes
            await user.save();
            
            // Simulate email
            console.log(`\n========================================`);
            console.log(`🛡️ SECURITY: MOCK EMAIL OTP SENT`);
            console.log(`To: ${email}`);
            console.log(`Subject: Chrome Login Verification`);
            console.log(`Body: We detected a login attempt from Google Chrome. Your verification code is: ${otp}`);
            console.log(`========================================\n`);
        }

        const historyRecord = new LoginHistory({
            uid,
            email,
            browser,
            os,
            deviceType,
            ipAddress,
            status
        });
        await historyRecord.save();

        if (otpRequired) {
            return res.status(202).json({ message: 'OTP Required', recordId: historyRecord._id });
        }

        res.status(200).json({ message: 'Login tracked successfully' });
    } catch (error) {
        console.error("Track Login Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Verify Login OTP
router.post('/verify-login-otp', async (req, res) => {
    try {
        const { uid, otp, recordId } = req.body;
        const user = await User.findOne({ uid });

        if (!user || user.currentOtp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }

        // Check OTP expiry
        if (!user.otpExpiry || new Date() > user.otpExpiry) {
            user.currentOtp = undefined;
            user.otpExpiry = undefined;
            await user.save();
            return res.status(400).json({ error: 'OTP has expired. Please login again.' });
        }

        user.currentOtp = undefined;
        await user.save();

        if (recordId) {
            await LoginHistory.findByIdAndUpdate(recordId, { status: 'OTP Verified' });
        }

        res.status(200).json({ message: 'Login Verified' });
    } catch (error) {
        console.error("Verify Login OTP Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Fetch Login History (user can only fetch their own)
router.get('/history/:uid', async (req, res) => {
    try {
        const requestingUid = req.headers['x-requesting-uid'];
        if (!requestingUid || requestingUid !== req.params.uid) {
            return res.status(403).json({ error: 'Forbidden: You can only view your own login history.' });
        }
        const history = await LoginHistory.find({ uid: req.params.uid }).sort({ createdAt: -1 }).limit(10);
        res.status(200).json(history);
    } catch (error) {
        console.error("Fetch Login History Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
