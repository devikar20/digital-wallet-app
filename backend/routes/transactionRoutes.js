
const express = require("express");
const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const OPENING_BALANCE = 73500;

// SEND REAL-TIME NOTIFICATION
function sendWalletNotification(io, userId, notification) {
  if (!io) return;

  io.to(`user:${userId}`).emit("notification", {
    ...notification,
    createdAt: new Date(),
  });
}

// CALCULATE USER BALANCE
const calculateBalance = async (userId, session = null) => {
  const query = Transaction.find({ user: userId });

  if (session) {
    query.session(session);
  }

  const transactions = await query;

  return transactions.reduce((balance, transaction) => {
    return balance + (
      transaction.type === "income"
        ? transaction.amount
        : -transaction.amount
    );
  }, OPENING_BALANCE);
};

router.use(protect);

// SEARCH RECIPIENT USING ACCOUNT ID
router.get("/recipients", async (req, res, next) => {
  try {
    const accountId = String(req.query.accountId || "").trim();

    if (!/^\d{6}$/.test(accountId)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit Account ID.",
      });
    }

    const recipient = await User.findOne({
      accountId,
      _id: { $ne: req.user._id },
    }).select("name email accountId");

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "No WalletPay user found with this Account ID.",
      });
    }

    res.json({
      success: true,
      data: recipient,
    });
  } catch (error) {
    next(error);
  }
});

// TRANSFER MONEY USING ACCOUNT ID
router.post("/transfer", async (req, res, next) => {
  const { recipientAccountId, amount, description } = req.body;

  const accountId =
    typeof recipientAccountId === "string"
      ? recipientAccountId.trim()
      : "";

  if (
    !/^\d{6}$/.test(accountId) ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid 6-digit Account ID and amount are required.",
    });
  }

  try {
    const recipient = await User.findOne({
      accountId,
      _id: { $ne: req.user._id },
    }).select("name email accountId");

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient Account ID not found.",
      });
    }

    const session = await mongoose.startSession();
    let transferResult;

    try {
      await session.withTransaction(async () => {
        const senderBalance = await calculateBalance(
          req.user._id,
          session
        );

        if (amount > senderBalance) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        const note =
          typeof description === "string"
            ? description.trim().slice(0, 100)
            : "";

        const [senderTransaction, recipientTransaction] =
          await Transaction.create(
            [
              {
                user: req.user._id,
                name: `Transfer to ${recipient.name}`,
                amount,
                type: "expense",
                category: "Transfer",
                date: new Date(),
                status: "Completed",
              },
              {
                user: recipient._id,
                name: `Received from ${req.user.name}`,
                amount,
                type: "income",
                category: "Transfer",
                date: new Date(),
                status: "Completed",
              },
            ],
            { session, ordered: true }
          );

        transferResult = {
          senderTransaction,
          recipientTransaction,
          senderBalance: senderBalance - amount,
          recipientBalance: await calculateBalance(
            recipient._id,
            session
          ),
          description: note,
        };
      });
    } finally {
      await session.endSession();
    }

    // SEND NOTIFICATION TO SENDER
    const io = req.app.get("io");

    sendWalletNotification(io, req.user._id, {
      title: "Money Sent",
      message: `₹${amount} sent to ${recipient.name}.`,
      type: "success",
      transactionId: transferResult.senderTransaction._id,
    });

    // SEND NOTIFICATION TO RECIPIENT
    sendWalletNotification(io, recipient._id, {
      title: "Money Received",
      message: `₹${amount} received from ${req.user.name}.`,
      type: "success",
      transactionId: transferResult.recipientTransaction._id,
    });

    res.status(201).json({
      success: true,
      message: `₹${amount} successfully sent to ${recipient.name}.`,
      data: {
        transaction: transferResult.senderTransaction,
        recipient: {
          name: recipient.name,
          accountId: recipient.accountId,
        },
        balance: transferResult.senderBalance,
      },
    });
  } catch (error) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    next(error);
  }
});

// WALLET SUMMARY
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

    res.json({
      success: true,
      balance: OPENING_BALANCE + totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
    });
  } catch (error) {
    next(error);
  }
});

// GET ALL TRANSACTIONS
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

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
});

// GET SINGLE TRANSACTION
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

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// CREATE TRANSACTION (ADD MONEY / EXPENSE)
router.post("/", async (req, res, next) => {
  try {
    const { name, amount, type, category, date } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof amount !== "number" ||
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

    sendWalletNotification(req.app.get("io"), req.user._id, {
      title: "New Transaction",
      message: `${newTransaction.name} of ₹${amount} was added.`,
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
      typeof updated.amount !== "number" ||
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
      current.type === "income"
        ? current.amount
        : -current.amount;

    const newEffect =
      updated.type === "income"
        ? updated.amount
        : -updated.amount;

    if (currentBalance - oldEffect + newEffect < 0) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...updated, name: updated.name.trim() },
      { new: true, runValidators: true }
    );

    sendWalletNotification(req.app.get("io"), req.user._id, {
      title: "Transaction Updated",
      message: `${updatedTransaction.name} was updated successfully.`,
      type: "info",
      transactionId: updatedTransaction._id,
    });

    res.json({
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

    sendWalletNotification(req.app.get("io"), req.user._id, {
      title: "Transaction Deleted",
      message: `${deletedTransaction.name} was deleted from your wallet.`,
      type: "warning",
      transactionId: deletedTransaction._id,
    });

    res.json({
      success: true,
      message: "Transaction deleted successfully.",
      data: deletedTransaction,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
