require("dotenv").config(); // Loads environment variables from a .env file into process.env

const config = require("./config.json"); // Loads configuration settings from config.json
const mongoose = require("mongoose"); // Imports Mongoose for interacting with MongoDB
const bcrypt = require("bcrypt"); // Imports bcrypt for password hashing
const express = require("express"); // Imports Express framework for handling HTTP requests
const cors = require("cors"); // Imports CORS middleware to allow cross-origin requests
const jwt = require("jsonwebtoken"); // Imports JWT for authentication and token management
const upload = require("./multer"); // Imports the Multer configuration for handling file uploads
const fs = require("fs"); // Imports the File System module for handling files
const path = require("path"); // Imports the Path module for working with file paths

const { authenticateToken } = require("./utilities"); // Imports authentication middleware for protected routes

const User = require("./models/user_model"); // Imports the User model for database operations
const TravelStory = require("./models/travel_story_model"); // Imports the TravelStory model for database operations
const { start } = require("repl");

mongoose.connect(config.connectionString); // Connects to MongoDB using the connection string from config.json

const app = express(); // Initializes an Express application
app.use(express.json()); // Enables Express to parse JSON request bodies
app.use(cors({ origin: "*" })); // Allows cross-origin requests from any domain

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
        return res.status(404).json({ error: true, message: "User not found" });
    }

    return res.json({
        user: isUser,
        message: "",
    })
});

// Route to handle image upload
app.post("/image-upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) { // No file upload
            return res.status(400).json({ error: true, message: "No image uploaded" });
        }

        const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;
        res.status(201).json({ imageUrl });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Delete an image from uploads 
app.delete("/delete-image", async (req, res) => {
    const { imageUrl } = req.query;

    if (!imageUrl) {
        return res.status(400).json({ error: true, message: "imageUrl is required" });
    }

    try {
        // Extract filename from the imageUrl
        const filename = path.basename(imageUrl);

        // Define file path
        const filePath = path.join(__dirname, 'uploads', filename);

        // Check if file path exists
        if (fs.existsSync(filePath)) {
            // Delete the file from the uploads folder
            fs.unlinkSync(filePath);
            res.status(200).json({ message: "Image deleted successfully" });
        } else {
            res.status(404).json({ error: true, message: "Image not found" });
        }
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Serve static files from the uploads and assets directory
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Allows client to access uploaded files
app.use("/assets", express.static(path.join(__dirname, "assets"))); 

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
        res.status(500).json({ error: true, message: error.message }); // 500 is for internal server error
    }
});

// Edit travel story
app.put("/edit-story/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { userId } = req.user;

    // Validate required fields
    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    // Convert visitedDate from milliseconds to Date object
    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try {
        // Find travel story by id and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        const placeHolderImgUrl = `http://localhost:8000/assets/placeholder.png`; // use placeholder image when no image provided

        travelStory.title = title;
        travelStory.story = story;
        travelStory.visitedLocation = visitedLocation;
        travelStory.imageUrl = imageUrl || placeHolderImgUrl;
        travelStory.visitedDate = visitedDate;

        await travelStory.save();
        res.status(200).json({ story: travelStory, message: "Update Successful" });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Delete travel story
app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
        // Find travel story by id and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        // Delete travel story from the database
        await travelStory.deleteOne({ _id: id, userId: userId });

        // Extract filename from the imageUrl
        const imageUrl = travelStory.imageUrl;
        const filename = path.basename(imageUrl);

        // Define the file path
        const filePath = path.join(__dirname, 'uploads', filename);

        // Delete the image file from the uploads folder
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Failed to delete image file:", err);
            }
        });

        res.status(200).json({ message: "Travel story deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Update favourite status
app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { isFavourite } = req.body;
    const { userId } = req.user;

    try {
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        travelStory.isFavourite = isFavourite;

        await travelStory.save();
        res.status(200).json({ story: travelStory, message: "Update successful" });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Search travel stories
app.get("/search", authenticateToken, async (req, res) => {
    const { query } = req.query;
    const { userId } = req.user;

    if (!query) {
        return res.status(400).json({ error: true, message: "query is required" });
    }

    try {
        const searchResults = await TravelStory.find({
            userId: userId,
            $or: [ // search for matches in the following
                { title: { $regex: query, $options: "i" } }, // $regex searches for substrings, $options: "i" makes it case-insensitive
                { story: { $regex: query, $options: "i" } },
                { visitedLocation: { $regex: query, $options: "i" } },
            ],
        }).sort({ isFavourite: -1 });

        res.status(200).json({ stories: searchResults });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Filter stories by date range
app.get("/travel-stories/filter", authenticateToken, async (req, res) => {
    const { startDate, endDate } = req.query;
    const { userId } = req.user;

    try {
        // Convert start and end dates from milliseconds to Date objects
        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));

        // Find travel stories belonging to user within the date range
        const filteredStories = await TravelStory.find({
            userId: userId,
            visitedDate: { $gte: start, $lte: end }, // gte for >=, lte for <= 
        }).sort({ isFavourite: -1 });

        res.status(200).json({ stories: filteredStories });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

app.listen(8000); 
module.exports = app;