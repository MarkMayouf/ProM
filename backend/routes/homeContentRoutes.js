import express from 'express';
const router = express.Router();
import {
  getHomeContent,
  getHomeContentAdmin,
  createOrUpdateHeroSection,
  addHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  createOrUpdateCollectionsSection,
  addCollection,
  updateCollection,
  deleteCollection,
  createOrUpdateFeaturedSuitsSection,
  addFeaturedSuit,
  updateFeaturedSuit,
  deleteFeaturedSuit,
  createOrUpdatePerfectCombinationsSection,
  addPerfectCombination,
  updatePerfectCombination,
  deletePerfectCombination,
  getProductsForSelection,
} from '../controllers/homeContentController.js';
import { protect, admin } from '../middleware/firebaseAuth.js';

// Public routes
router.route('/').get(getHomeContent);

// Admin routes
router.route('/admin').get(protect, admin, getHomeContentAdmin);
router.route('/products').get(protect, admin, getProductsForSelection);

// Hero section routes
router.route('/hero').post(protect, admin, createOrUpdateHeroSection);
router.route('/hero/slide').post(protect, admin, addHeroSlide);
router.route('/hero/slide/:slideId')
  .put(protect, admin, updateHeroSlide)
  .delete(protect, admin, deleteHeroSlide);

// Collections section routes
router.route('/collections').post(protect, admin, createOrUpdateCollectionsSection);
router.route('/collections/collection').post(protect, admin, addCollection);
router.route('/collections/collection/:collectionId')
  .put(protect, admin, updateCollection)
  .delete(protect, admin, deleteCollection);

// Featured suits section routes
router.route('/featured-suits').post(protect, admin, createOrUpdateFeaturedSuitsSection);
router.route('/featured-suits/suit').post(protect, admin, addFeaturedSuit);
router.route('/featured-suits/suit/:suitId')
  .put(protect, admin, updateFeaturedSuit)
  .delete(protect, admin, deleteFeaturedSuit);

// Perfect combinations section routes
router.route('/perfect-combinations').post(protect, admin, createOrUpdatePerfectCombinationsSection);
router.route('/perfect-combinations/combination').post(protect, admin, addPerfectCombination);
router.route('/perfect-combinations/combination/:combinationId')
  .put(protect, admin, updatePerfectCombination)
  .delete(protect, admin, deletePerfectCombination);

export default router; 