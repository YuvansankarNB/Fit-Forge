const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); 

mongoose.connect("mongodb://127.0.0.1:27017/fitforge", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "❌ MongoDB connection error:"));
db.once("open", () => console.log("✅ Connected to MongoDB"));

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }, 
});
const User = mongoose.model("User", userSchema);
const mealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  calories: Number,
  amount: Number,
  mealType: String,
  date: { type: Date, default: Date.now },
});
const Meal = mongoose.model("Meal", mealSchema);
const waterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  count: Number,
  date: { type: Date, default: Date.now },
});
const Water = mongoose.model("Water", waterSchema);

const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  category: String,
  sets: String,
  reps: String,
  difficulty: String,
  createdAt: { type: Date, default: Date.now },
});
const Workout = mongoose.model("Workout", workoutSchema);

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  weight: Number,
  bodyFat: Number,
  muscleMass: Number,
  createdAt: { type: Date, default: Date.now },
});
const Progress = mongoose.model("Progress", progressSchema);

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: String,
  price: Number,
  expires: String,
  createdAt: { type: Date, default: Date.now },
});
const Membership = mongoose.model("Membership", membershipSchema);

const SALT_ROUNDS = 10;

app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Missing username or password" });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Username already taken" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({ username, password: hashed });
    await newUser.save();
    res.status(201).json({ username: newUser.username, id: newUser._id });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ username: user.username, id: user._id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/meals/:userId", async (req, res) => {
  const meals = await Meal.find({ userId: req.params.userId }).sort({ date: -1 });
  res.json(meals);
});

app.post("/api/meals", async (req, res) => {
  const meal = new Meal(req.body);
  const saved = await meal.save();
  res.status(201).json(saved);
});

app.get("/api/water/:userId", async (req, res) => {
  const { userId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const water = await Water.findOne({ userId, date: { $gte: today } }).sort({ date: -1 });
  res.json(water || { count: 0 });
});

app.post("/api/water", async (req, res) => {
  const water = new Water(req.body);
  const saved = await water.save();
  res.status(201).json(saved);
});

app.get("/api/workouts/:userId", async (req, res) => {
  const workouts = await Workout.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(workouts);
});

app.post("/api/workouts", async (req, res) => {
  const workout = new Workout(req.body);
  const saved = await workout.save();
  res.status(201).json(saved);
});

app.get("/api/progress/:userId", async (req, res) => {
  const progress = await Progress.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(progress);
});

app.post("/api/progress", async (req, res) => {
  const progress = new Progress(req.body);
  const saved = await progress.save();
  res.status(201).json(saved);
});

app.get("/api/membership/:userId", async (req, res) => {
  const memberships = await Membership.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(memberships);
});

app.post("/api/membership", async (req, res) => {
  const membership = new Membership(req.body);
  const saved = await membership.save();
  res.status(201).json(saved);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
