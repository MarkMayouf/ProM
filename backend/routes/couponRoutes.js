import express from "express";
const router = express.Router();
import {
  applyCoupon,
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { protect, admin } from "../middleware/firebaseAuth.js";

// @route   POST /api/coupons/apply
// @access  Public (allow guest users to apply coupons)
router.post("/apply", applyCoupon);

// @route   POST /api/coupons
// @access  Private/Admin
router.route("/")
  .get(protect, admin, getCoupons)
  .post(protect, admin, createCoupon);

// @route   GET /api/coupons/:id
// @access  Private/Admin
router.route("/:id")
  .get(protect, admin, getCouponById)
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

export default router;

