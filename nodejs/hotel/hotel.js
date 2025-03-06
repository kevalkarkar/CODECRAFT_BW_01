require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Models
const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String
}));

const Room = mongoose.model('Room', new mongoose.Schema({
    title: String,
    description: String,
    price: Number
}));

const Booking = mongoose.model('Booking', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    roomId: mongoose.Schema.Types.ObjectId,
    checkIn: Date,
    checkOut: Date
}));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// Middleware to authenticate JWT
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.json({ message: 'User registered' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
});

app.get('/rooms', async (req, res) => {
    const rooms = await Room.find();
    res.json(rooms);
});

app.post('/bookings', authMiddleware, async (req, res) => {
    const { room_id, check_in, check_out } = req.body;
    const booking = new Booking({
        userId: req.user.userId,
        roomId: room_id,
        checkIn: new Date(check_in),
        checkOut: new Date(check_out)
    });
    await booking.save();
    res.json({ message: 'Room booked successfully' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
