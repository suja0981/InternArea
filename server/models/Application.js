const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    company: String,
    category: String,
    coverLetter: String,
    availability: String,
    user: Object,
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["approved", "rejected", "pending"],
        default: "pending"
    },
    Application: Object,
}, { timestamps: true });

module.exports = mongoose.model("Application", ApplicationSchema);