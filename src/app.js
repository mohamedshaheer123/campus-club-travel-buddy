
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve index.html from the src folder
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==================== MEMBER SCHEMA ====================

const memberSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    clubName: { type: String, required: true },
    year: { type: Number, required: true },
    role: { type: String, required: true },
    points: { type: Number, default: 0 },
    interests: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", memberSchema);

// ==================== BUDDY SCHEMA ====================

const buddySchema = new mongoose.Schema(
  {
    buddyId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    destination: { type: String, required: true },
    age: { type: Number, required: true },
    budget: { type: Number, required: true },
    tripDuration: { type: Number, required: true },
    interests: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Available", "Unavailable"],
      default: "Available",
    },
  },
  { timestamps: true }
);

const Buddy = mongoose.model("Buddy", buddySchema);

// ==================== HOME / HEALTH ====================

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// ==================== MEMBER ROUTES ====================

// Create a member
app.post("/members", async (req, res) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json({
      message: "Member created successfully",
      member,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all members
app.get("/members", async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search members by name, club, or role
app.get("/member-search", async (req, res) => {
  try {
    const keyword = req.query.q || "";
    const members = await Member.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { clubName: { $regex: keyword, $options: "i" } },
        { role: { $regex: keyword, $options: "i" } },
      ],
    });
    res.json(members);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get one member by MongoDB ID
app.get("/member/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.json(member);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a member
app.put("/member-update/:id", async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({ message: "Member updated successfully", member });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Increase member points
app.patch("/increase-points/:id", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Provide a positive amount in the amount field",
      });
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { $inc: { points: amount } },
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({ message: "Points increased successfully", member });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get members within a points range
app.get("/points-range", async (req, res) => {
  try {
    const min = Number(req.query.min ?? 0);
    const max = Number(req.query.max ?? Number.MAX_SAFE_INTEGER);

    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
      return res.status(400).json({ message: "Invalid points range" });
    }

    const members = await Member.find({
      points: { $gte: min, $lte: max },
    });

    res.json(members);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sort members by points
app.get("/members-sort", async (req, res) => {
  try {
    const members = await Member.find().sort({ points: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a member
app.delete("/member-delete/:id", async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({ message: "Member deleted successfully", member });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== BUDDY ROUTES ====================

// Create a travel buddy
app.post("/buddies", async (req, res) => {
  try {
    const buddy = await Buddy.create(req.body);
    res.status(201).json({
      message: "Travel buddy created successfully",
      buddy,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all travel buddies
app.get("/buddies", async (req, res) => {
  try {
    const buddies = await Buddy.find();
    res.json(buddies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search buddies by name or destination
app.get("/buddy-search", async (req, res) => {
  try {
    const keyword = req.query.q || "";
    const buddies = await Buddy.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { destination: { $regex: keyword, $options: "i" } },
      ],
    });
    res.json(buddies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get one buddy by MongoDB ID
app.get("/buddy/:id", async (req, res) => {
  try {
    const buddy = await Buddy.findById(req.params.id);
    if (!buddy) {
      return res.status(404).json({ message: "Travel buddy not found" });
    }
    res.json(buddy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a travel buddy
app.put("/buddy-update/:id", async (req, res) => {
  try {
    const buddy = await Buddy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!buddy) {
      return res.status(404).json({ message: "Travel buddy not found" });
    }

    res.json({ message: "Travel buddy updated successfully", buddy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Increase travel budget
app.patch("/increase-budget/:id", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Provide a positive amount in the amount field",
      });
    }

    const buddy = await Buddy.findByIdAndUpdate(
      req.params.id,
      { $inc: { budget: amount } },
      { new: true, runValidators: true }
    );

    if (!buddy) {
      return res.status(404).json({ message: "Travel buddy not found" });
    }

    res.json({ message: "Budget increased successfully", buddy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get buddies within a budget range
app.get("/budget-range", async (req, res) => {
  try {
    const min = Number(req.query.min ?? 0);
    const max = Number(req.query.max ?? Number.MAX_SAFE_INTEGER);

    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
      return res.status(400).json({ message: "Invalid budget range" });
    }

    const buddies = await Buddy.find({
      budget: { $gte: min, $lte: max },
    });

    res.json(buddies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sort buddies by budget (lowest first)
app.get("/buddies-sort", async (req, res) => {
  try {
    const buddies = await Buddy.find().sort({ budget: 1 });
    res.json(buddies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a travel buddy
app.delete("/buddy-delete/:id", async (req, res) => {
  try {
    const buddy = await Buddy.findByIdAndDelete(req.params.id);

    if (!buddy) {
      return res.status(404).json({ message: "Travel buddy not found" });
    }

    res.json({ message: "Travel buddy deleted successfully", buddy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ERROR HANDLER ====================

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ==================== DATABASE + SERVER ====================

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing. Check that src/.env exists and contains MONGO_URI."
      );
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
