
const express = require("express");
const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const OPENING_BALANCE = 73500;

// Send real-time notification to the logged-in user's connected devices
function sendWalletNotification(req, notification) {
  const io = req.app.get("io");

  if (!io) return;

  io.to(`user:${req.user._id}`).emit("notification", {
    ...notification,
    createdAt: new Date(),
  });
}

// Every transaction route requires login
router.use(protect);

// Calculate wallet balance for a particular user
const calculateBalance = async (userId) => {
  const transactions = await Transaction.find({ user: userId });

  return transactions.reduce((balance, transaction) => {
    return (
      balance +
      (transaction.type === "income"
        ? transaction.amount
        : -transaction.amount)
    );
  }, OPENING_BALANCE);
};

// GET WALLET SUMMARY
router.get("/summary", async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
    });

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      success: true,
      balance: OPENING_BALANCE + totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
    });
  } catch (error) {
    next(error);
  }
});

// GET ALL USER TRANSACTIONS
router.get("/", async (req, res, next) => {
  try {
    const filter = { user: req.user._id };

    if (req.query.type) {
      if (!["income", "expense"].includes(req.query.type)) {
        return res.status(400).json({
          success: false,
          message: "Type must be income or expense.",
        });
      }

      filter.type = req.query.type;
    }

    const transactions = await Transaction.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
});

// GET SINGLE USER TRANSACTION
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// CREATE TRANSACTION
router.post("/", async (req, res, next) => {
  try {
    const { name, amount, type, category, date } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !["income", "expense"].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid name, positive amount and type are required.",
      });
    }

    const currentBalance = await calculateBalance(req.user._id);

    if (type === "expense" && amount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const newTransaction = await Transaction.create({
      user: req.user._id,
      name: name.trim(),
      amount,
      type,
      category: category || "General",
      date: date || new Date(),
    });

    // REAL-TIME NOTIFICATION
    sendWalletNotification(req, {
      title: "New Transaction",
      message: `${newTransaction.name} of ₹${newTransaction.amount} was added.`,
      type: "success",
      transactionId: newTransaction._id,
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully.",
      data: newTransaction,
      balance: await calculateBalance(req.user._id),
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE TRANSACTION
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    const current = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    const { name, amount, type, category, date } = req.body;

    const updated = {
      name: name !== undefined ? name : current.name,
      amount: amount !== undefined ? amount : current.amount,
      type: type !== undefined ? type : current.type,
      category: category !== undefined ? category : current.category,
      date: date !== undefined ? date : current.date,
    };

    if (
      typeof updated.name !== "string" ||
      !updated.name.trim() ||
      !Number.isFinite(updated.amount) ||
      updated.amount <= 0 ||
      !["income", "expense"].includes(updated.type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction details.",
      });
    }

    const currentBalance = await calculateBalance(req.user._id);

    const oldEffect =
      current.type === "income" ? current.amount : -current.amount;

    const newEffect =
      updated.type === "income" ? updated.amount : -updated.amount;

    const resultingBalance = currentBalance - oldEffect + newEffect;

    if (resultingBalance < 0) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        ...updated,
        name: updated.name.trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // REAL-TIME NOTIFICATION
    sendWalletNotification(req, {
      title: "Transaction Updated",
      message: `${updatedTransaction.name} was updated successfully.`,
      type: "info",
      transactionId: updatedTransaction._id,
    });

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully.",
      data: updatedTransaction,
      balance: await calculateBalance(req.user._id),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE TRANSACTION
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deletedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    // REAL-TIME NOTIFICATION
    sendWalletNotification(req, {
      title: "Transaction Deleted",
      message: `${deletedTransaction.name} was deleted from your wallet.`,
      type: "warning",
      transactionId: deletedTransaction._id,
    });

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
      data: deletedTransaction,
      balance: await calculateBalance(req.user._id),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
