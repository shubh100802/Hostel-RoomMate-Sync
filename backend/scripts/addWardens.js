const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Warden = require('../models/Warden');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mutual-hostel-manager';

const wardensData = [
  {
    email: "warden@vitbhopal.ac.in",
    name: "Dr. Rajesh Sharma",
    password: "warden123"
  },
  {
    email: "supervisor1@vitbhopal.ac.in",
    name: "Mrs. Priya Patel",
    password: "supervisor123"
  },
  {
    email: "supervisor2@vitbhopal.ac.in",
    name: "Mr. Amit Kumar",
    password: "supervisor456"
  }
  // Add more wardens/supervisors here as needed
];

async function addOrUpdateWardens() {
  await mongoose.connect(MONGO_URI);
  for (const wardenData of wardensData) {
    const existingWarden = await Warden.findOne({ email: wardenData.email });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(wardenData.password, salt);
    if (existingWarden) {
      existingWarden.name = wardenData.name;
      existingWarden.password = hashedPassword;
      await existingWarden.save();
      console.log(`🔄 Updated warden: ${wardenData.name} (${wardenData.email})`);
    } else {
      await Warden.create({
        email: wardenData.email,
        name: wardenData.name,
        password: hashedPassword
      });
      console.log(`✅ Added warden: ${wardenData.name} (${wardenData.email})`);
    }
  }
  console.log("\n🎉 All wardens processed successfully!");
  mongoose.disconnect();
}

addOrUpdateWardens(); 