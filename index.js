const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { createDbConnection } = require("./db");
const UserModel = require("./model/user.model");
const BookModel = require("./model/book.model");
const serviceData = JSON.parse(
  fs.readFileSync("./Services.json", "utf-8")
);
const { ObjectId } = require("mongodb");
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://0.0.0.0:10000",
      "https://glam-on-go-beauty-services-mern-app.netlify.app"
    ],
    methods: ["POST", "GET", "DELETE", "PUT"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());

// Middleware to verify JWT token
const verifyJwt = (req, res, next) => {
  const token = req.cookies.token; // JWT token is stored in cookies

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY || "default_secret_key"
    );
    req.user = decoded; // Add decoded user data to request object
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// API Route for creating a user
app.post("/create", async (req, res) => {
  console.log(req.body);
  try {
    const user = new UserModel(req.body);
    const result = await user.save();
    res.json({ status: "Success", user: result });
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ status: "ERROR", message: err.message });
  }
});

// API Route for user login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "ERROR", message: "No record exists" });
    }

    // Compare plain text password (⚠️ Not Secure)
    if (password !== user.password) {
      return res.status(401).json({ status: "ERROR", message: "Incorrect email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, id: user._id, username:user.username }, 
      process.env.JWT_SECRET_KEY || "default_secret_key",
      { expiresIn: "1d" }
    );

    // Set JWT in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.json({
      status: "Success",
      message: "Login successful",
      user: { email: user.email, userid: user._id, username:user.username },
     });

  } catch (err) {
    console.error("Error logging in:", err.message);
    res.status(500).json({ status: "ERROR", message: "Internal server error" });
  }
});

// 📌 Create a new booking
app.post("/api/bookings", async (req, res) => {
    try {
        const {
          username,
            userid,
            userEmail,
            address,
            contact,
            age,
            gender,
            dateTime,
            serviceName,
            price
        } = req.body;

        // ✅ Check if required fields are present
        if ( !username || !userid || !userEmail || !address || !contact || !age || !gender || !dateTime || !serviceName || !price) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // ✅ Create and save the booking
        const newBooking = new BookModel({
          username,
            userid,
            userEmail,
            address,
            contact,
            age,
            gender,
            dateTime,
            serviceName,
            price
        });

        await newBooking.save();
        res.status(201).json({ message: "Booking successful!", booking: newBooking });
    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// 📌 Get all bookings for a specific user
app.get("/api/bookings/:userid", async (req, res) => {
  try {
      const { userid } = req.params;
      const parlourBookings = await BookModel.find({ userid});

      if (!parlourBookings.length) {
          return res.status(404).json({ message: "No parlour bookings found." });
      }

      res.status(200).json(parlourBookings);
  } catch (error) {
      console.error("Fetching Parlour Bookings Error:", error);
      res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// cancel booking
// DELETE booking by ID only if date/time is in the future
app.delete("/api/cancelbookings/:bookingId", async (req, res) => {
  const bookingId = req.params.bookingId;

  // Optional: Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ message: "Invalid booking ID format." });
  }

  try {
    const booking = await BookModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found!" });
    }

    const bookingDateTime = new Date(booking.dateTime);
    const now = new Date();

    if (bookingDateTime < now) {
      return res.status(400).json({ message: "Cannot cancel past bookings." });
    }

    await BookModel.findByIdAndDelete(bookingId);

    res.status(200).json({ message: "Booking cancelled successfully." });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Error cancelling booking", error });
  }
});




// Starting the server
app.listen(process.env.PORT, process.env.HOSTNAME, function () {
  createDbConnection();
  console.log("connected")
});
