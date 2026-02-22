const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "your_secret_key";

// Register
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser)
        return res.status(400).json({ error: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } 
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
    return res.status(400).json({ error: "All fields are required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

        res.json({
            message: "Login successful",
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } 
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;