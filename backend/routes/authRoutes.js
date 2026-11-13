
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Generate a unique 6-digit Account ID
const generateAccountId = async () => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const accountId = String(
      crypto.randomInt(100000, 1000000)
    );

    const existing = await User.findOne({ accountId });

    if (!existing) {
      return accountId;
    }
  }

  throw new Error("Unable to generate a unique Account ID.");
};

// Assign an Account ID to an existing user if missing
const ensureAccountId = async (user) => {
  if (user.accountId) {
    return user;
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    const accountId = await generateAccountId();

    try {
      user.accountId = accountId;
      await user.save();
      return user;
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      user.accountId = undefined;
    }
  }

  throw new Error("Unable to assign Account ID.");
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

// Public user information
const getPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  accountId: user.accountId,
  role: user.role,
});

// REGISTER USER
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid name, email and password of at least 8 characters.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const accountId = await generateAccountId();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      accountId,
      password: hashedPassword,
      role: "user",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: getPublicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with these details already exists. Please try again.",
      });
    }

    next(error);
  }
});

// LOGIN USER
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    await ensureAccountId(user);

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: getPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// GET CURRENT LOGGED-IN USER
router.get("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await ensureAccountId(user);

    res.status(200).json({
      success: true,
      user: getPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
