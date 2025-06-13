import express from "express";
const router = express.Router();
import { getDashboardStats } from "../controllers/adminController.js";
import { protect, admin } from "../middleware/firebaseAuth.js";

// @route   GET /api/admin/stats
// @access  Private/Admin
router.route("/stats").get(protect, admin, getDashboardStats);

export default router;

