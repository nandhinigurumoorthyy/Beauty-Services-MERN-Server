const mongoose = require("mongoose");

const BookSchema = mongoose.Schema(
  {
    username: { type: String, required: true },
    userid: { type: String, required: true }, // Link booking to user
    userEmail: { type: String, required: true }, 
    address: { type: String, required: true },
    contact: {
      type: Number,
      required: [true, "Contact number is required"],
      min: [1000000000, "Contact number must be at least 10 digits"],
      max: [9999999999, "Contact number must be no more than 10 digits"],
    },
    age: {
      type: Number, required: true, min: [1, "Age must be at least 1"],
      max: [120, "Age must be no more than 120"],
    },
    gender: { type: String, required: true, enum: ["Male", "Female","Other"], },
    dateTime: { type: Date, required: true },
    serviceName: { type: String, required: true }, // Store booked service
    price: { type: Number, required: true }
  },
  { timestamps: true }
);

const BookModel = mongoose.model("Booking", BookSchema);

module.exports = BookModel;