require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { authenticateToken } = require("./utilities");

const User = require("./models/user_model");
const TravelStory = require("./models/travel_story_model");

mongoose.connect(config.connectionString);

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Create account
app.post("/create-account", async (req, res) => {
    const { fullName, email, password } = req.body;

    // Missing field 
    if (!fullName || !email || !password) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    // Duplicate email
    const isUser = await User.findOne({ email });
    if (isUser) {
        return res.status(400).json({ error: true, message: "This email is already being used" });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Return user object with hashed password instead of plaintext password 
    const user = new User({
        fullName, email, password: hashedPassword,
    });

    // Save to db
    await user.save();

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "72h", // user is logged in for 72h
        }
    );

    return res.status(201).json({
        error: false,
        user: { fullName: user.fullName, email: user.email },
        accessToken,
        message: "Registration Successful",
    });
});

// Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Missing field
    if (!email || !password) {
        return res.status(400).json({ message: "Email and Password are required" });
    }

    // Check for registered email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    // Check that password matches
    const isValidPassword = await bcrypt.compare(password, user.password); // salt used is embedded in hash, hence can match passwords
    if (!isValidPassword) {
        return res.status(400).json({ message: "Incorrect Password" });
    }

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "72h",
        }
    );

    return res.json({
        error: false,
        message: "Login Successful",
        user: { fullName: user.fullName, email: user.email },
        accessToken,
    });
});

// Get user
app.get("/get-user", authenticateToken, async (req, res) => {
    const { userId } = req.user

    const isUser = await User.findOne({ _id: userId });

    // User not found in database
    if (!isUser) {
        return res.sendStatus(401)
    }

    return res.json({
        user: isUser,
        message: "",
    })
});

// Add travel story
app.post("/add-travel-story", authenticateToken, async (req, res) => {
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { userId } = req.user

    // Validate required fields
    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    // Convert visitedDate from milliseconds to Date object
    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try {
        const travelStory = new TravelStory({
            title,
            story,
            visitedLocation,
            userId,
            imageUrl,
            visitedDate: parsedVisitedDate,
        });

        await travelStory.save();
        res.status(201).json({ story: travelStory, message: "Added successfully" });
    } catch (error) {
        res.status(400).json({ error: true, message: error.message });
    }
});

// Get all travel stories
app.get("/get-all-stories", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const travelStories = await TravelStory.find({ userId: userId }).sort({ isFavourite: -1 }); // -1 for descending order (starts from favourites)
        res.status(200).json({ stories: travelStories });   
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});



app.listen(8000);
module.exports = app;