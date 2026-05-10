require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const cron = require('node-cron');
const { connect } = require('./db');
const router = require("./routes/index");
const User = require('./models/User');

const port = process.env.PORT || 5000;
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'https://internshala-clone-u8za.onrender.com',
];
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.get('/', (req, res) => {
    res.send("Hello World");
});

app.use('/api', router);

connect();

// Reset applicationsThisMonth for all users on the 1st of every month at midnight IST
// Cron: '0 0 1 * *' = At 00:00 on day 1 of every month (server UTC time)
cron.schedule('30 18 1 * *', async () => {
    try {
        const result = await User.updateMany({}, { $set: { applicationsThisMonth: 0 } });
        console.log(`✅ Monthly Reset: applicationsThisMonth reset for ${result.modifiedCount} users.`);
    } catch (err) {
        console.error('❌ Monthly reset cron job failed:', err);
    }
}, { timezone: 'Asia/Kolkata' });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});