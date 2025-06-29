const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Warden = require("../models/Warden");
const connectDB = require("../config/db");

connectDB();

const addWardens = async () => {
    try {
        // Sample wardens data
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
        ];

        for (const wardenData of wardensData) {
            // Check if warden already exists
            const existingWarden = await Warden.findOne({ email: wardenData.email });
            
            if (existingWarden) {
                console.log(`⚠️  Warden ${wardenData.email} already exists, skipping...`);
                continue;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(wardenData.password, salt);

            // Create warden
            await Warden.create({
                email: wardenData.email,
                name: wardenData.name,
                password: hashedPassword
            });

            console.log(`✅ Added warden: ${wardenData.name} (${wardenData.email})`);
        }

        console.log("\n🎉 All wardens added successfully!");
        console.log("\n📋 Login Credentials:");
        console.log("1. warden@vitbhopal.ac.in / warden123");
        console.log("2. supervisor1@vitbhopal.ac.in / supervisor123");
        console.log("3. supervisor2@vitbhopal.ac.in / supervisor456");

    } catch (error) {
        console.error("❌ Error adding wardens:", error);
    } finally {
        process.exit();
    }
};

addWardens(); 