
const express = require("express");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes below require admin access
router.use(protect, authorize("admin"));

// GET ALL REGISTERED USERS
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

// GET ALL WALLET TRANSACTIONS
router.get("/transactions", async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
