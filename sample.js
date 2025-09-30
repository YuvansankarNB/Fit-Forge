const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/fit", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

const sqlConnection = mysql.createConnection({
  host: "localhost",
  user: "root",       
  password: "",        
  database: "fitforge" 
});

sqlConnection.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err.message);
  } else {
    console.log("Connected to MySQL");
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Missing username or password" });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Username already taken" });

    const newUser = new User({ username, password });
    await newUser.save();

    sqlConnection.query(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, password],
      (err, results) => {
        if (err) {
          console.error("MySQL signup error:", err.message);
          return res.status(500).json({ message: "MySQL error" });
        }
        res.status(201).json({ username: newUser.username, id: newUser._id });
      }
    );
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
