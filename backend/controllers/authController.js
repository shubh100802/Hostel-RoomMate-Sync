// ============ AUTHENTICATION CONTROLLER ============
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Warden = require("../models/Warden");

const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const Model = role === "student" ? Student : Warden;
    const user = await Model.findOne({ email });

    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Incorrect password" });

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: "2h"
    });

    // Return all user fields except password
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { login };
