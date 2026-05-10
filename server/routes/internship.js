const express = require('express');
const router = express.Router();
const Internship = require('../models/Internship');
const adminAuth = require('../middleware/adminAuth');

router.post("/", adminAuth, async (req, res) => {
  try {
    const Internshipdata = new Internship({
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      category: req.body.category,
      aboutCompany: req.body.aboutCompany,
      aboutInternship: req.body.aboutInternship,
      whoCanApply: req.body.whoCanApply,
      perks: req.body.perks,
      numberOfOpening: req.body.numberOfOpening,
      stipend: req.body.stipend,
      startDate: req.body.startDate,
      additionalInfo: req.body.additionalInfo,
    });
    const data = await Internshipdata.save();
    res.status(201).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/", async (req, res) => {
try{
  const data = await Internship.find();
  res.status(200).json(data);
}
catch(error){
  console.log(error);
res.status(500).json({ message: "Server Error" });
}
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
try{
  const data = await Internship.findById(id);
  if(!data){
    return res.status(404).json({ message: "Internship not found" });
  }
  res.status(200).json(data);
}
catch(error){
  console.log(error);
res.status(500).json({ message: "Server Error" });
}
});
module.exports = router;