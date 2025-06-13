import express from 'express';
const router = express.Router();
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  debugSaleProducts,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/firebaseAuth.js';
import checkObjectId from '../middleware/checkObjectId.js';

// Public routes
router.route('/').get(getProducts);
router.get('/top', getTopProducts);
router.get('/debug/sales', debugSaleProducts);

// Admin routes
router.route('/')
  .post(protect, admin, createProduct);

// Routes requiring valid ObjectId
router.route('/:id')
  .get(checkObjectId, getProductById)
  .put(protect, admin, checkObjectId, updateProduct)
  .delete(protect, admin, checkObjectId, deleteProduct);

router.route('/:id/reviews')
  .post(protect, checkObjectId, createProductReview);

export default router;
