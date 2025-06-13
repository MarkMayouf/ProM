// import express from "express";
// import asyncHandler from "../middleware/asyncHandler.js";
// import Stripe from "stripe";
// import dotenv from "dotenv";

// dotenv.config();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// const router = express.Router();

// // @desc    Create a Stripe payment intent
// // @route   POST /api/config/stripe/paymentintent
// // @access  Private
// router.post("/paymentintent", asyncHandler(async (req, res) => {
//   const { amount, currency } = req.body; // Amount should be in cents

//   if (!amount || !currency) {
//     res.status(400);
//     throw new Error("Amount and currency are required");
//   }

//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amount,
//       currency: currency,
//       payment_method_types: ["card"],
//     });

//     res.send({
//       clientSecret: paymentIntent.client_secret,
//     });
//   } catch (error) {
//     console.error("Stripe Error:", error.message);
//     res.status(500);
//     throw new Error("Failed to create payment intent: " + error.message);
//   }
// }));

// // @desc    Get Stripe publishable key
// // @route   GET /api/config/stripe/publishablekey
// // @access  Private
// router.get("/publishablekey", (req, res) => {
//   if (!process.env.STRIPE_PUBLISHABLE_KEY) {
//     console.error("Stripe Publishable Key not found in .env");
//     res.status(500);
//     throw new Error("Stripe configuration error");
//   }
//   res.send({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
// });

// export default router;
