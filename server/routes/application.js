const express = require("express");
const router = express.Router();
const application = require("../models/Application");
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

router.post("/", async (req, res) => {
  try {
    const uid = req.body.user?.uid;
    if (!uid) {
      return res.status(401).json({ message: "You must be logged in to apply." });
    }

    const userDoc = await User.findOne({ uid });
    if (!userDoc) {
      return res.status(404).json({ message: "User profile not found. Please sync your account." });
    }

    const planLimits = { 'Free': 1, 'Bronze': 3, 'Silver': 5, 'Gold': Infinity };
    const userLimit = planLimits[userDoc.plan] || 1;

    // --- Monthly Limit Reset Logic ---
    const today = new Date();
    if (userDoc.lastApplicationDate) {
      const lastAppDate = new Date(userDoc.lastApplicationDate);
      if (lastAppDate.getMonth() !== today.getMonth() || lastAppDate.getFullYear() !== today.getFullYear()) {
        userDoc.applicationsThisMonth = 0;
      }
    }

    if (userDoc.applicationsThisMonth >= userLimit && userLimit !== Infinity) {
      return res.status(403).json({ 
          error: "Limit_Exceeded",
          message: `You have reached your ${userDoc.plan} plan limit of ${userLimit} internship applications this month. Please upgrade your plan.`
      });
    }

    if (!req.body.Application || !req.body.coverLetter) {
        return res.status(400).json({ error: "Missing Required Fields: Cover letter and Resume (Application) are mandatory." });
    }

    const applicationipdata = new application({
      company: req.body.company,
      category: req.body.category,
      coverLetter: req.body.coverLetter,
      availability: req.body.availability,
      user: req.body.user,
      Application: req.body.Application,
    });

    const data = await applicationipdata.save();
    
    // Increment the limit tracker and update date
    userDoc.applicationsThisMonth += 1;
    userDoc.lastApplicationDate = today;
    await userDoc.save();

    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const data = await application.find();
    res.status(200).json(data);
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await application.findById(id);
    if (!data) {
      return res.status(404).json({ message: "application not found" });
    }
    res.status(200).json(data);
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});
router.put("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  let status
  if (action === "approved") {
    status = "approved"
  }
  else if (action === "rejected") {
    status = "rejected"
  }
  else {
    return res.status(400).json({ message: "Invalid action" });
  }
  try {
    const updatedApplication = await application.findByIdAndUpdate(id,
      { $set: { status } },
      { new: true }
    );
    if (!updatedApplication) {
      return res.status(404).json({ message: "application not found" });
    }
    res.status(200).json({ success: true, message: `application ${status} successfully`, data: updatedApplication });
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});
module.exports = router;