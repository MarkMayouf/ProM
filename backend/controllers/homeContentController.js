import asyncHandler from '../middleware/asyncHandler.js';
import HomeContent from '../models/homeContentModel.js';
import Product from '../models/productModel.js';

// @desc    Get all home content sections
// @route   GET /api/home-content
// @access  Public
const getHomeContent = asyncHandler(async (req, res) => {
  const homeContent = await HomeContent.find({ isActive: true })
    .populate('featuredSuits.productId')
    .populate('perfectCombinations.suit.productId')
    .populate('perfectCombinations.shoes.productId')
    .populate('perfectCombinations.accessories.productId')
    .sort({ createdAt: 1 });

  // Transform data for frontend
  const result = {
    heroSlides: [],
    collections: [],
    featuredSuits: [],
    perfectCombinations: [],
    settings: {}
  };

  homeContent.forEach(section => {
    if (section.sectionType === 'hero' && section.heroSlides.length > 0) {
      result.heroSlides = section.heroSlides
        .filter(slide => slide.isActive)
        .sort((a, b) => a.order - b.order);
      result.settings.hero = {
        autoplay: section.settings.heroAutoplay,
        interval: section.settings.heroInterval
      };
    }
    if (section.sectionType === 'collections' && section.collections.length > 0) {
      result.collections = section.collections
        .filter(collection => collection.isActive)
        .sort((a, b) => a.order - b.order);
    }
    if (section.sectionType === 'perfect-combinations' && section.perfectCombinations.length > 0) {
      result.perfectCombinations = section.perfectCombinations
        .filter(combo => combo.isActive)
        .sort((a, b) => a.order - b.order);
    }
  });

  // Get high-rated and best-selling suits for featured suits section
  // We'll fetch suits with rating >= 4.0 and sort by rating first, then by numReviews (indicating sales/popularity)
  const highRatedSuits = await Product.find({
    category: 'Suits',
    rating: { $gte: 4.0 },
    countInStock: { $gt: 0 } // Only show suits in stock
  })
  .sort({ 
    rating: -1,        // Highest rated first
    numReviews: -1,    // Most reviewed (indicating best sellers) second
    createdAt: -1      // Newest as tiebreaker
  })
  .limit(4); // Limit to 4 suits for featured section

  // Transform suits data for featured suits section
  result.featuredSuits = highRatedSuits.map((suit, index) => ({
    _id: suit._id,
    productId: suit,
    title: `${suit.name}`,
    description: suit.description || `Premium ${suit.style || 'Business'} suit with exceptional quality and fit.`,
    customImage: suit.image,
    order: index,
    isActive: true,
    // Include product data directly for frontend compatibility
    name: suit.name,
    price: suit.price,
    image: suit.image,
    category: suit.category,
    brand: suit.brand,
    countInStock: suit.countInStock,
    rating: suit.rating,
    numReviews: suit.numReviews,
    regularPrice: suit.regularPrice,
    salePrice: suit.salePrice
  }));

  res.json(result);
});

// @desc    Get all home content sections for admin
// @route   GET /api/home-content/admin
// @access  Private/Admin
const getHomeContentAdmin = asyncHandler(async (req, res) => {
  const homeContent = await HomeContent.find({})
    .populate('featuredSuits.productId')
    .sort({ createdAt: 1 });

  res.json(homeContent);
});

// @desc    Create or update hero section
// @route   POST /api/home-content/hero
// @access  Private/Admin
const createOrUpdateHeroSection = asyncHandler(async (req, res) => {
  const { heroSlides, settings } = req.body;

  let heroSection = await HomeContent.findOne({ sectionType: 'hero' });

  if (heroSection) {
    heroSection.heroSlides = heroSlides;
    heroSection.settings = { ...heroSection.settings, ...settings };
    heroSection.isActive = true;
  } else {
    heroSection = new HomeContent({
      sectionType: 'hero',
      heroSlides,
      settings: {
        heroAutoplay: settings?.heroAutoplay ?? true,
        heroInterval: settings?.heroInterval ?? 5000,
      },
      isActive: true,
    });
  }

  const updatedHeroSection = await heroSection.save();
  res.json(updatedHeroSection);
});

// @desc    Add hero slide
// @route   POST /api/home-content/hero/slide
// @access  Private/Admin
const addHeroSlide = asyncHandler(async (req, res) => {
  const { title, subtitle, description, image, buttonText, buttonLink, order } = req.body;

  let heroSection = await HomeContent.findOne({ sectionType: 'hero' });

  if (!heroSection) {
    heroSection = new HomeContent({
      sectionType: 'hero',
      heroSlides: [],
      isActive: true,
    });
  }

  const newSlide = {
    title,
    subtitle,
    description,
    image,
    buttonText: buttonText || 'Shop Now',
    buttonLink: buttonLink || '/products',
    order: order || heroSection.heroSlides.length,
    isActive: true,
  };

  heroSection.heroSlides.push(newSlide);
  const updatedHeroSection = await heroSection.save();

  res.status(201).json(updatedHeroSection);
});

// @desc    Update hero slide
// @route   PUT /api/home-content/hero/slide/:slideId
// @access  Private/Admin
const updateHeroSlide = asyncHandler(async (req, res) => {
  const { slideId } = req.params;
  const updateData = req.body;

  const heroSection = await HomeContent.findOne({ sectionType: 'hero' });

  if (!heroSection) {
    res.status(404);
    throw new Error('Hero section not found');
  }

  const slideIndex = heroSection.heroSlides.findIndex(
    slide => slide._id.toString() === slideId
  );

  if (slideIndex === -1) {
    res.status(404);
    throw new Error('Hero slide not found');
  }

  heroSection.heroSlides[slideIndex] = {
    ...heroSection.heroSlides[slideIndex].toObject(),
    ...updateData,
  };

  const updatedHeroSection = await heroSection.save();
  res.json(updatedHeroSection);
});

// @desc    Delete hero slide
// @route   DELETE /api/home-content/hero/slide/:slideId
// @access  Private/Admin
const deleteHeroSlide = asyncHandler(async (req, res) => {
  const { slideId } = req.params;

  const heroSection = await HomeContent.findOne({ sectionType: 'hero' });

  if (!heroSection) {
    res.status(404);
    throw new Error('Hero section not found');
  }

  heroSection.heroSlides = heroSection.heroSlides.filter(
    slide => slide._id.toString() !== slideId
  );

  const updatedHeroSection = await heroSection.save();
  res.json(updatedHeroSection);
});

// @desc    Create or update collections section
// @route   POST /api/home-content/collections
// @access  Private/Admin
const createOrUpdateCollectionsSection = asyncHandler(async (req, res) => {
  const { collections } = req.body;

  let collectionsSection = await HomeContent.findOne({ sectionType: 'collections' });

  if (collectionsSection) {
    collectionsSection.collections = collections;
    collectionsSection.isActive = true;
  } else {
    collectionsSection = new HomeContent({
      sectionType: 'collections',
      collections,
      isActive: true,
    });
  }

  const updatedCollectionsSection = await collectionsSection.save();
  res.json(updatedCollectionsSection);
});

// @desc    Add collection
// @route   POST /api/home-content/collections/collection
// @access  Private/Admin
const addCollection = asyncHandler(async (req, res) => {
  const { name, description, image, category, subCategory, link, order, isFeatured } = req.body;

  let collectionsSection = await HomeContent.findOne({ sectionType: 'collections' });

  if (!collectionsSection) {
    collectionsSection = new HomeContent({
      sectionType: 'collections',
      collections: [],
      isActive: true,
    });
  }

  const newCollection = {
    name,
    description,
    image,
    category,
    subCategory,
    link,
    order: order || collectionsSection.collections.length,
    isFeatured: isFeatured || false,
    isActive: true,
  };

  collectionsSection.collections.push(newCollection);
  const updatedCollectionsSection = await collectionsSection.save();

  res.status(201).json(updatedCollectionsSection);
});

// @desc    Update collection
// @route   PUT /api/home-content/collections/collection/:collectionId
// @access  Private/Admin
const updateCollection = asyncHandler(async (req, res) => {
  const { collectionId } = req.params;
  const updateData = req.body;

  const collectionsSection = await HomeContent.findOne({ sectionType: 'collections' });

  if (!collectionsSection) {
    res.status(404);
    throw new Error('Collections section not found');
  }

  const collectionIndex = collectionsSection.collections.findIndex(
    collection => collection._id.toString() === collectionId
  );

  if (collectionIndex === -1) {
    res.status(404);
    throw new Error('Collection not found');
  }

  collectionsSection.collections[collectionIndex] = {
    ...collectionsSection.collections[collectionIndex].toObject(),
    ...updateData,
  };

  const updatedCollectionsSection = await collectionsSection.save();
  res.json(updatedCollectionsSection);
});

// @desc    Delete collection
// @route   DELETE /api/home-content/collections/collection/:collectionId
// @access  Private/Admin
const deleteCollection = asyncHandler(async (req, res) => {
  const { collectionId } = req.params;

  const collectionsSection = await HomeContent.findOne({ sectionType: 'collections' });

  if (!collectionsSection) {
    res.status(404);
    throw new Error('Collections section not found');
  }

  collectionsSection.collections = collectionsSection.collections.filter(
    collection => collection._id.toString() !== collectionId
  );

  const updatedCollectionsSection = await collectionsSection.save();
  res.json(updatedCollectionsSection);
});

// @desc    Create or update featured suits section
// @route   POST /api/home-content/featured-suits
// @access  Private/Admin
const createOrUpdateFeaturedSuitsSection = asyncHandler(async (req, res) => {
  const { featuredSuits } = req.body;

  let featuredSuitsSection = await HomeContent.findOne({ sectionType: 'featured-suits' });

  if (featuredSuitsSection) {
    featuredSuitsSection.featuredSuits = featuredSuits;
    featuredSuitsSection.isActive = true;
  } else {
    featuredSuitsSection = new HomeContent({
      sectionType: 'featured-suits',
      featuredSuits,
      isActive: true,
    });
  }

  const updatedFeaturedSuitsSection = await featuredSuitsSection.save();
  await updatedFeaturedSuitsSection.populate('featuredSuits.productId');
  res.json(updatedFeaturedSuitsSection);
});

// @desc    Add featured suit
// @route   POST /api/home-content/featured-suits/suit
// @access  Private/Admin
const addFeaturedSuit = asyncHandler(async (req, res) => {
  const { productId, title, description, customImage, order } = req.body;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let featuredSuitsSection = await HomeContent.findOne({ sectionType: 'featured-suits' });

  if (!featuredSuitsSection) {
    featuredSuitsSection = new HomeContent({
      sectionType: 'featured-suits',
      featuredSuits: [],
      isActive: true,
    });
  }

  const newFeaturedSuit = {
    productId,
    title,
    description,
    customImage,
    order: order || featuredSuitsSection.featuredSuits.length,
    isActive: true,
  };

  featuredSuitsSection.featuredSuits.push(newFeaturedSuit);
  const updatedFeaturedSuitsSection = await featuredSuitsSection.save();
  await updatedFeaturedSuitsSection.populate('featuredSuits.productId');

  res.status(201).json(updatedFeaturedSuitsSection);
});

// @desc    Update featured suit
// @route   PUT /api/home-content/featured-suits/suit/:suitId
// @access  Private/Admin
const updateFeaturedSuit = asyncHandler(async (req, res) => {
  const { suitId } = req.params;
  const updateData = req.body;

  // If updating productId, verify it exists
  if (updateData.productId) {
    const product = await Product.findById(updateData.productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
  }

  const featuredSuitsSection = await HomeContent.findOne({ sectionType: 'featured-suits' });

  if (!featuredSuitsSection) {
    res.status(404);
    throw new Error('Featured suits section not found');
  }

  const suitIndex = featuredSuitsSection.featuredSuits.findIndex(
    suit => suit._id.toString() === suitId
  );

  if (suitIndex === -1) {
    res.status(404);
    throw new Error('Featured suit not found');
  }

  featuredSuitsSection.featuredSuits[suitIndex] = {
    ...featuredSuitsSection.featuredSuits[suitIndex].toObject(),
    ...updateData,
  };

  const updatedFeaturedSuitsSection = await featuredSuitsSection.save();
  await updatedFeaturedSuitsSection.populate('featuredSuits.productId');
  res.json(updatedFeaturedSuitsSection);
});

// @desc    Delete featured suit
// @route   DELETE /api/home-content/featured-suits/suit/:suitId
// @access  Private/Admin
const deleteFeaturedSuit = asyncHandler(async (req, res) => {
  const { suitId } = req.params;

  const featuredSuitsSection = await HomeContent.findOne({ sectionType: 'featured-suits' });

  if (!featuredSuitsSection) {
    res.status(404);
    throw new Error('Featured suits section not found');
  }

  featuredSuitsSection.featuredSuits = featuredSuitsSection.featuredSuits.filter(
    suit => suit._id.toString() !== suitId
  );

  const updatedFeaturedSuitsSection = await featuredSuitsSection.save();
  res.json(updatedFeaturedSuitsSection);
});

// @desc    Create or update perfect combinations section
// @route   POST /api/home-content/perfect-combinations
// @access  Private/Admin
const createOrUpdatePerfectCombinationsSection = asyncHandler(async (req, res) => {
  const { perfectCombinations } = req.body;

  let perfectCombinationsSection = await HomeContent.findOne({ sectionType: 'perfect-combinations' });

  if (perfectCombinationsSection) {
    perfectCombinationsSection.perfectCombinations = perfectCombinations;
    perfectCombinationsSection.isActive = true;
  } else {
    perfectCombinationsSection = new HomeContent({
      sectionType: 'perfect-combinations',
      perfectCombinations,
      isActive: true,
    });
  }

  const updatedPerfectCombinationsSection = await perfectCombinationsSection.save();
  await updatedPerfectCombinationsSection.populate([
    'perfectCombinations.suit.productId',
    'perfectCombinations.shoes.productId',
    'perfectCombinations.accessories.productId'
  ]);
  res.json(updatedPerfectCombinationsSection);
});

// @desc    Add perfect combination
// @route   POST /api/home-content/perfect-combinations/combination
// @access  Private/Admin
const addPerfectCombination = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    suit, 
    shoes, 
    accessories, 
    totalPrice, 
    discountedPrice, 
    savings, 
    rating, 
    numReviews, 
    order 
  } = req.body;

  // Clean up empty productId values and verify products exist if productIds are provided
  const cleanSuit = {
    ...suit,
    productId: suit.productId && suit.productId.trim() !== '' ? suit.productId : null
  };
  
  const cleanShoes = {
    ...shoes,
    productId: shoes.productId && shoes.productId.trim() !== '' ? shoes.productId : null
  };
  
  const cleanAccessories = {
    ...accessories,
    productId: accessories.productId && accessories.productId.trim() !== '' ? accessories.productId : null
  };

  if (cleanSuit.productId) {
    const suitProduct = await Product.findById(cleanSuit.productId);
    if (!suitProduct) {
      res.status(404);
      throw new Error('Suit product not found');
    }
  }

  if (cleanShoes.productId) {
    const shoesProduct = await Product.findById(cleanShoes.productId);
    if (!shoesProduct) {
      res.status(404);
      throw new Error('Shoes product not found');
    }
  }

  if (cleanAccessories.productId) {
    const accessoriesProduct = await Product.findById(cleanAccessories.productId);
    if (!accessoriesProduct) {
      res.status(404);
      throw new Error('Accessories product not found');
    }
  }

  let perfectCombinationsSection = await HomeContent.findOne({ sectionType: 'perfect-combinations' });

  if (!perfectCombinationsSection) {
    perfectCombinationsSection = new HomeContent({
      sectionType: 'perfect-combinations',
      perfectCombinations: [],
      isActive: true,
    });
  }

  const newPerfectCombination = {
    name,
    description,
    suit: cleanSuit,
    shoes: cleanShoes,
    accessories: cleanAccessories,
    totalPrice,
    discountedPrice,
    savings,
    rating: rating || 4.5,
    numReviews: numReviews || 0,
    order: order || perfectCombinationsSection.perfectCombinations.length,
    isActive: true,
  };

  perfectCombinationsSection.perfectCombinations.push(newPerfectCombination);
  const updatedPerfectCombinationsSection = await perfectCombinationsSection.save();
  await updatedPerfectCombinationsSection.populate([
    'perfectCombinations.suit.productId',
    'perfectCombinations.shoes.productId',
    'perfectCombinations.accessories.productId'
  ]);

  res.status(201).json(updatedPerfectCombinationsSection);
});

// @desc    Update perfect combination
// @route   PUT /api/home-content/perfect-combinations/combination/:combinationId
// @access  Private/Admin
const updatePerfectCombination = asyncHandler(async (req, res) => {
  const { combinationId } = req.params;
  const updateData = req.body;

  // Clean up empty productId values in the update data
  if (updateData.suit && updateData.suit.productId !== undefined) {
    updateData.suit.productId = updateData.suit.productId && updateData.suit.productId.trim() !== '' ? updateData.suit.productId : null;
  }
  if (updateData.shoes && updateData.shoes.productId !== undefined) {
    updateData.shoes.productId = updateData.shoes.productId && updateData.shoes.productId.trim() !== '' ? updateData.shoes.productId : null;
  }
  if (updateData.accessories && updateData.accessories.productId !== undefined) {
    updateData.accessories.productId = updateData.accessories.productId && updateData.accessories.productId.trim() !== '' ? updateData.accessories.productId : null;
  }

  const perfectCombinationsSection = await HomeContent.findOne({ sectionType: 'perfect-combinations' });

  if (!perfectCombinationsSection) {
    res.status(404);
    throw new Error('Perfect combinations section not found');
  }

  const combinationIndex = perfectCombinationsSection.perfectCombinations.findIndex(
    combination => combination._id.toString() === combinationId
  );

  if (combinationIndex === -1) {
    res.status(404);
    throw new Error('Perfect combination not found');
  }

  perfectCombinationsSection.perfectCombinations[combinationIndex] = {
    ...perfectCombinationsSection.perfectCombinations[combinationIndex].toObject(),
    ...updateData,
  };

  const updatedPerfectCombinationsSection = await perfectCombinationsSection.save();
  await updatedPerfectCombinationsSection.populate([
    'perfectCombinations.suit.productId',
    'perfectCombinations.shoes.productId',
    'perfectCombinations.accessories.productId'
  ]);
  res.json(updatedPerfectCombinationsSection);
});

// @desc    Delete perfect combination
// @route   DELETE /api/home-content/perfect-combinations/combination/:combinationId
// @access  Private/Admin
const deletePerfectCombination = asyncHandler(async (req, res) => {
  const { combinationId } = req.params;

  const perfectCombinationsSection = await HomeContent.findOne({ sectionType: 'perfect-combinations' });

  if (!perfectCombinationsSection) {
    res.status(404);
    throw new Error('Perfect combinations section not found');
  }

  perfectCombinationsSection.perfectCombinations = perfectCombinationsSection.perfectCombinations.filter(
    combination => combination._id.toString() !== combinationId
  );

  const updatedPerfectCombinationsSection = await perfectCombinationsSection.save();
  res.json(updatedPerfectCombinationsSection);
});

// @desc    Get all products for featured suits selection
// @route   GET /api/home-content/products
// @access  Private/Admin
const getProductsForSelection = asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .select('name image price category subCategory brand')
    .sort({ createdAt: -1 });

  res.json(products);
});

export {
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
}; 