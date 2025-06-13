import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';
import mongoose from 'mongoose';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || Number(process.env.PAGINATION_LIMIT) || 12;
  const page = Number(req.query.pageNumber) || 1;

  // Build the filter object step by step
  const filter = {};

  // Add keyword search if present
  if (req.query.keyword) {
    filter.name = {
      $regex: req.query.keyword,
      $options: 'i',
    };
  }

  // Add category filter if present and valid
  const categoryValue = req.query.category;
  if (categoryValue && typeof categoryValue === 'string') {
    const trimmedCategory = categoryValue.trim();
    if (!['null', 'undefined', ''].includes(trimmedCategory.toLowerCase())) {
      // Match case-insensitively against the category
      filter.category = {
        $regex: new RegExp(`^${trimmedCategory}$`, 'i')
      };
      console.log('Adding category filter:', trimmedCategory);
    }
  }

  // Add subcategory filter if present and valid
  const subcategoryValue = req.query.subcategory;
  if (subcategoryValue && typeof subcategoryValue === 'string') {
    const trimmedSubcategory = subcategoryValue.trim();
    if (!['null', 'undefined', ''].includes(trimmedSubcategory.toLowerCase())) {
      // Match case-insensitively against the subCategory
      filter.subCategory = {
        $regex: new RegExp(`^${trimmedSubcategory}$`, 'i')
      };
      console.log('Adding subcategory filter:', trimmedSubcategory);
    }
  }

  // Add price range filters
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) {
      filter.price.$gte = Number(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      filter.price.$lte = Number(req.query.maxPrice);
    }
  }

  // Add sale filter if present
  if (req.query.sale === 'true' || req.query.onSale === 'true') {
    const now = new Date();
    filter.$and = [
      { isOnSale: true },
      {
        $or: [
          { saleStartDate: { $lte: now } },
          { saleStartDate: { $exists: false } }
        ]
      },
      {
        $or: [
          { saleEndDate: { $gte: now } },
          { saleEndDate: { $exists: false } }
        ]
      }
    ];
    console.log('Adding sale filter for active sales');
  }

  console.log('API filter:', filter);

  // Build sort object
  let sortOption = { createdAt: -1 }; // Default sort by newest

  if (req.query.sort) {
    switch (req.query.sort) {
      case 'price-low':
      case 'priceAsc':
        sortOption = { price: 1 };
        break;
      case 'price-high':
      case 'priceDesc':
        sortOption = { price: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'rating':
        sortOption = { rating: -1, numReviews: -1 };
        break;
      case 'popularity':
        sortOption = { numReviews: -1, rating: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }
  }

  try {
    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    // Log the results
    console.log(`Found ${products.length} products matching filters:`, {
      category: filter.category,
      subCategory: filter.subCategory,
      priceRange: filter.price,
      sort: req.query.sort,
      total: count
    });

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      totalProducts: count
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  // NOTE: checking for valid ObjectId to prevent CastError moved to separate
  // middleware. See README for more info.

  const product = await Product.findById(req.params.id);
  if (product) {
    return res.json(product);
  } else {
    // NOTE: this will run if a valid ObjectId but no product was found
    // i.e. product may be null
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  try {
    // Extract all provided values from request body
    const { 
      name, 
      price, 
      description, 
      image, 
      images,
      brand, 
      category, 
      subCategory,
      countInStock,
      color,
      material,
      fit,
      style,
      pieces,
      isOnSale,
      salePrice,
      saleStartDate,
      saleEndDate,
      sizes,
      regularPrice
    } = req.body;
    
    // Basic required fields validation
    const requiredFields = ['name', 'price', 'category', 'brand', 'description', 'color', 'material', 'fit', 'style'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      res.status(400);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate category
    const validCategories = ['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts', 'Shirts', 'Accessories', 'Shoes'];
    if (!validCategories.includes(category)) {
      res.status(400);
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate fit
    const validFits = ['Regular', 'Slim', 'Relaxed'];
    if (!validFits.includes(fit)) {
      res.status(400);
      throw new Error(`Invalid fit. Must be one of: ${validFits.join(', ')}`);
    }

    // Validate style
    const validStyles = ['Business', 'Casual', 'Sport'];
    if (!validStyles.includes(style)) {
      res.status(400);
      throw new Error(`Invalid style. Must be one of: ${validStyles.join(', ')}`);
    }

    // Validate subCategory requirement
    if (category !== 'Accessories' && !subCategory) {
      res.status(400);
      throw new Error('subCategory is required for non-accessory products');
    }

    // Validate images array if provided
    if (images && Array.isArray(images) && images.length > 10) {
      res.status(400);
      throw new Error('Maximum 10 images allowed per product');
    }

    // Validate sizes requirement
    if (['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts', 'Shirts', 'Shoes'].includes(category)) {
      if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
        res.status(400);
        throw new Error('Sizes are required for this category');
      }
      // Validate size objects
      for (const size of sizes) {
        if (!size.size || typeof size.quantity !== 'number') {
          res.status(400);
          throw new Error('Each size must have a size name and quantity');
        }
      }
    }

    // Validate pieces for Suits and Tuxedos
    if (['Suits', 'Tuxedos'].includes(category)) {
      if (!pieces || ![2, 3].includes(Number(pieces))) {
        res.status(400);
        throw new Error('Pieces must be either 2 or 3 for Suits and Tuxedos');
      }
    }

    // Validate price is a positive number
    if (isNaN(price) || price <= 0) {
      res.status(400);
      throw new Error('Price must be a positive number');
    }

    // Validate sale fields if isOnSale is true
    if (isOnSale) {
      if (!salePrice || salePrice >= price) {
        res.status(400);
        throw new Error('Sale price must be lower than regular price');
      }
      if (!saleStartDate || !saleEndDate) {
        res.status(400);
        throw new Error('Sale start date and end date are required when product is on sale');
      }
      const startDate = new Date(saleStartDate);
      const endDate = new Date(saleEndDate);
      if (endDate <= startDate) {
        res.status(400);
        throw new Error('Sale end date must be after start date');
      }
    }

    // Create product with validated data
    const product = new Product({
      name,
      price,
      user: req.user._id,
      image: image || '/images/sample.jpg',
      images: images || [],
      brand,
      category,
      subCategory: subCategory || '', 
      countInStock: countInStock || 0,
      numReviews: 0,
      description,
      color,
      material,
      fit,
      style,
      pieces: pieces || 2,
      isOnSale: isOnSale || false,
      regularPrice: regularPrice || price,
      salePrice: isOnSale ? salePrice : null,
      saleStartDate: isOnSale ? saleStartDate : null,
      saleEndDate: isOnSale ? saleEndDate : null,
      sizes: sizes || []
    });

    // Update stock based on sizes
    product.updateStock();

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      res.status(400);
      throw new Error(Object.values(error.errors).map(err => err.message).join(', '));
    }
    throw error;
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    images,
    brand,
    category,
    subCategory,
    countInStock,
    color,
    material,
    fit,
    style,
    pieces,
    isOnSale,
    salePrice,
    saleStartDate,
    saleEndDate,
    regularPrice,
    sizes
  } = req.body;

  // Validate ObjectId
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error(`Invalid ObjectId format: ${req.params.id}`);
  }

  // Validate images array if provided
  if (images && Array.isArray(images) && images.length > 10) {
    res.status(400);
    throw new Error('Maximum 10 images allowed per product');
  }

  const product = await Product.findById(req.params.id);

  if (product) {
    // Update basic fields
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.image = image || product.image;
    product.images = images !== undefined ? images : product.images;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.subCategory = subCategory || product.subCategory;
    product.countInStock = countInStock || product.countInStock;
    product.color = color || product.color;
    product.material = material || product.material;
    product.fit = fit || product.fit;
    product.style = style || product.style;
    product.pieces = pieces || product.pieces;
    product.regularPrice = regularPrice || product.regularPrice || product.price;
    
    // Handle sale fields
    if (isOnSale !== undefined) {
      product.isOnSale = isOnSale;
      if (isOnSale) {
        if (!salePrice || salePrice >= product.regularPrice) {
          res.status(400);
          throw new Error('Sale price must be lower than regular price');
        }
        if (!saleStartDate) {
          res.status(400);
          throw new Error('Sale start date is required when product is on sale');
        }
        if (!saleEndDate) {
          res.status(400);
          throw new Error('Sale end date is required when product is on sale');
        }
        
        const startDate = new Date(saleStartDate);
        const endDate = new Date(saleEndDate);
        
        if (endDate <= startDate) {
          res.status(400);
          throw new Error('Sale end date must be after start date');
        }

        product.salePrice = salePrice;
        product.saleStartDate = startDate;
        product.saleEndDate = endDate;
      } else {
        // Remove sale data when isOnSale is false
        product.salePrice = null;
        product.saleStartDate = null;
        product.saleEndDate = null;
      }
    }
    
    // Update sizes if provided
    if (sizes && Array.isArray(sizes)) {
      product.sizes = sizes;
      product.updateStock(); // Update total stock based on sizes
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({
      _id: product._id
    });
    res.json({
      message: 'Product removed'
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const {
    rating,
    comment
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    // Check if user has already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    // Check if user has purchased the product
    const Order = mongoose.model('Order');
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'orderItems.product': product._id,
      isPaid: true
    });

    if (!hasPurchased) {
      res.status(400);
      throw new Error('You must purchase this product before reviewing');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({
      message: 'Review added'
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  try {
    console.log('Fetching top rated products...');
    const products = await Product.find({})
      .sort({ rating: -1 })
      .limit(3)
      .select('name price image rating numReviews'); // Only select needed fields

    if (!products || products.length === 0) {
      console.log('No products found');
      return res.status(404).json({ message: 'No products found' });
    }

    console.log(`Found ${products.length} top rated products`);
    res.json(products);
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    res.status(500).json({
      message: 'Error fetching top products',
      error: error.message
    });
  }
});

// @desc    Debug sale products
// @route   GET /api/products/debug/sales
// @access  Public
const debugSaleProducts = asyncHandler(async (req, res) => {
  console.log('🔍 DEBUG: Checking all products for sale status...');
  
  const allProducts = await Product.find({});
  const now = new Date();
  
  const debugInfo = {
    totalProducts: allProducts.length,
    currentTime: now,
    products: allProducts.map(product => ({
      id: product._id,
      name: product.name,
      isOnSale: product.isOnSale,
      price: product.price,
      salePrice: product.salePrice,
      regularPrice: product.regularPrice,
      saleStartDate: product.saleStartDate,
      saleEndDate: product.saleEndDate,
      saleActive: product.isOnSale && 
                 (!product.saleStartDate || new Date(product.saleStartDate) <= now) &&
                 (!product.saleEndDate || new Date(product.saleEndDate) >= now),
      hasValidPricing: product.isOnSale && 
                      (product.salePrice || product.regularPrice) && 
                      product.price < (product.regularPrice || product.price)
    }))
  };
  
  const saleProducts = debugInfo.products.filter(p => p.saleActive && p.hasValidPricing);
  
  console.log('🔍 DEBUG: Found', saleProducts.length, 'valid sale products');
  
  res.json({
    ...debugInfo,
    validSaleProducts: saleProducts.length,
    saleProducts: saleProducts
  });
});

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  debugSaleProducts,
};