const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// Initialize Razorpay with real keys from env
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_SECRET || 'placeholder_secret'
});

// Helper: check IST payment window (10:00 AM – 11:00 AM)
const isWithinPaymentWindow = () => {
    const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric' };
    const istHour = parseInt(new Date().toLocaleString('en-US', options), 10);
    return istHour === 10; // strictly 10:00–10:59 IST
};

// Plan pricing and rank (for downgrade prevention)
const planPrices = { 'Bronze': 100, 'Silver': 300, 'Gold': 1000 };
const planRank  = { 'Free': 0, 'Bronze': 1, 'Silver': 2, 'Gold': 3 };

// 1. Create Order
router.post('/create-order', async (req, res) => {
    try {
        if (!isWithinPaymentWindow()) {
            return res.status(403).json({
                error: 'Payments are only allowed between 10:00 AM and 11:00 AM IST.'
            });
        }

        const { plan, uid } = req.body;

        if (!plan || !uid) {
            return res.status(400).json({ error: 'Plan and UID are required.' });
        }

        if (!planPrices[plan]) {
            return res.status(400).json({ error: 'Invalid plan selected. Choose Bronze, Silver, or Gold.' });
        }

        // Prevent downgrade: check user's current plan
        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: 'User not found. Please sync your account.' });

        if (planRank[plan] <= planRank[user.plan]) {
            return res.status(400).json({
                error: `You are already on the ${user.plan} plan. You can only upgrade to a higher plan.`
            });
        }

        const options = {
            amount: planPrices[plan] * 100, // paise
            currency: 'INR',
            receipt: `rcpt_${uid.slice(0, 8)}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ order, plan, uid });
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
    }
});

// 2. Verify Payment & Upgrade Plan
router.post('/verify', async (req, res) => {
    try {
        if (!isWithinPaymentWindow()) {
            return res.status(403).json({
                error: 'Payments are only allowed between 10:00 AM and 11:00 AM IST.'
            });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, uid } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !plan || !uid) {
            return res.status(400).json({ error: 'Missing required payment fields.' });
        }

        // ── Signature Verification ──────────────────────────────────────────
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(body)
            .digest('hex');
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Payment signature verification failed. Possible tampering detected.' });
        }
        // ────────────────────────────────────────────────────────────────────

        if (!planPrices[plan]) {
            return res.status(400).json({ error: 'Invalid plan in verification request.' });
        }

        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // Prevent downgrade via direct API call
        if (planRank[plan] <= planRank[user.plan]) {
            return res.status(400).json({ error: 'Plan downgrade is not allowed.' });
        }

        const previousPlan = user.plan;
        user.plan = plan;
        user.applicationsThisMonth = 0; // Reset on new subscription
        user.planStartDate = new Date();
        await user.save();

        // Generate invoice reference
        const invoiceRef = `INV-${Date.now()}`;
        const invoiceDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const planLimits = { 'Bronze': '3 applications/month', 'Silver': '5 applications/month', 'Gold': 'Unlimited applications' };

        // Mock email invoice (replace with Nodemailer/SendGrid in production)
        console.log(`\n========================================`);
        console.log(`📧 MOCK EMAIL INVOICE SENT`);
        console.log(`To: ${user.email || 'User'}`);
        console.log(`Subject: ✅ Payment Successful — ${plan} Plan Activated`);
        console.log(`\nInvoice Reference : ${invoiceRef}`);
        console.log(`Date & Time (IST) : ${invoiceDate}`);
        console.log(`Transaction ID    : ${razorpay_payment_id}`);
        console.log(`Order ID          : ${razorpay_order_id}`);
        console.log(`Plan Upgraded     : ${previousPlan} → ${plan}`);
        console.log(`Amount Paid       : ₹${planPrices[plan]}`);
        console.log(`Application Limit : ${planLimits[plan]}`);
        console.log(`Valid From        : ${invoiceDate}`);
        console.log(`\nThank you for subscribing to Intern Area!`);
        console.log(`========================================\n`);

        res.status(200).json({
            message: `🎉 Payment verified! Your account has been upgraded to the ${plan} Plan.`,
            invoiceRef,
            plan,
            transactionId: razorpay_payment_id
        });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: 'Payment verification failed. Contact support with your payment ID.' });
    }
});

module.exports = router;
