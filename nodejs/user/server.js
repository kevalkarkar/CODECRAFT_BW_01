const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const Joi = require("joi");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/usersDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define user schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number,
});
const User = mongoose.model("User", userSchema);

// Joi validation schema
const validationSchema = Joi.object({
    name: Joi.string().min(1).required(),
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(0).required(),
});


// Redirect / to serve index.html


// Create a user
app.post("/users", async (req, res) => {
    const { error, value } = validationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = new User(value);
    await user.save();
    res.status(201).json(user);
});

// Get all users
app.get("/users", async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// Get a single user
app.get("/users/:id", async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
});

// Update a user
app.put("/users/:id", async (req, res) => {
    const { error, value } = validationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = await User.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
});

// Delete a user
app.delete("/users/:id", async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.sendStatus(204);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
