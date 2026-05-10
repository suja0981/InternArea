const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const User = require('../models/User');
const Resume = require('../models/Resume');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890abcd',
    key_secret: process.env.RAZORPAY_SECRET || 'dummy_secret_1234567890abcd'
});

// Helper to check IST Time Window (10:00 AM - 11:00 AM)
const isWithinPaymentWindow = () => {
    const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric' };
    const istHour = parseInt(new Date().toLocaleString('en-US', options), 10);
    return istHour === 10;
};

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        if (!isWithinPaymentWindow()) {
            return res.status(403).json({ 
                error: 'Payments and Resume generation are only allowed between 10:00 AM and 11:00 AM IST.' 
            });
        }

        const { uid } = req.body;
        if (!uid) return res.status(400).json({ error: 'UID is required' });

        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.plan === 'Free') {
            return res.status(403).json({ error: 'Resume Builder is only available for Premium plans (Bronze, Silver, Gold).' });
        }

        const otp = generateOTP();
        user.currentOtp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        await user.save();

        // Simulate sending email
        console.log(`\n========================================`);
        console.log(`🔐 MOCK EMAIL OTP SENT`);
        console.log(`To: ${user.email || 'User'}`);
        console.log(`Subject: Resume Builder Verification Code`);
        console.log(`Body: Your OTP for the Premium Resume Builder is: ${otp}. Do not share this with anyone.`);
        console.log(`========================================\n`);

        res.status(200).json({ message: 'OTP sent successfully to your registered email.' });
    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// 2. Verify OTP & Create Order
router.post('/verify-and-order', async (req, res) => {
    try {
        if (!isWithinPaymentWindow()) {
            return res.status(403).json({ 
                error: 'Payments are only allowed between 10:00 AM and 11:00 AM IST.' 
            });
        }
        const { uid, otp } = req.body;
        const user = await User.findOne({ uid });

        if (!user || user.currentOtp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP or expired session.' });
        }

        if (!user.otpExpiry || new Date() > user.otpExpiry) {
            user.currentOtp = undefined;
            user.otpExpiry = undefined;
            await user.save();
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Clear OTP after successful verification
        user.currentOtp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // Create Razorpay Order for ₹50
        const options = {
            amount: 50 * 100, // 50 INR in paise
            currency: 'INR',
            receipt: `resume_order_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ message: 'OTP verified', order });
    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// 3. Verify Payment & Save Resume
router.post('/verify-payment', async (req, res) => {
    try {
        if (!isWithinPaymentWindow()) {
            return res.status(403).json({ 
                error: 'Payments are only allowed between 10:00 AM and 11:00 AM IST.' 
            });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, uid, resumeData } = req.body;

        // ── Signature Verification ──────────────────────────────────────────
        const crypto = require('crypto');
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(body)
            .digest('hex');
        
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Payment signature verification failed. Possible tampering detected.' });
        }
        // ────────────────────────────────────────────────────────────────────

        // Create Resume
        const newResume = new Resume({
            uid,
            ...resumeData
        });
        await newResume.save();

        // Link to User
        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.resumeId = newResume._id;
        await user.save();

        res.status(200).json({ message: 'Resume created successfully!', resume: newResume });
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ error: 'Failed to create resume after payment' });
    }
});

// 4. Fetch User Resume
router.get('/:uid', async (req, res) => {
    try {
        const resume = await Resume.findOne({ uid: req.params.uid });
        if (!resume) return res.status(404).json({ error: 'Resume not found' });
        res.status(200).json(resume);
    } catch (error) {
        console.error("Fetch Resume Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
