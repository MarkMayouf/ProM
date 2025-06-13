import mongoose from 'mongoose';

const heroSlideSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
    required: true,
  },
  buttonText: {
    type: String,
    default: 'Shop Now',
  },
  buttonLink: {
    type: String,
    default: '/products',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const collectionSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
  },
  link: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const featuredSuitSchema = mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  customImage: {
    type: String,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Perfect Combinations Schema
const perfectCombinationSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  suit: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: String,
    image: String,
    price: Number,
    category: String,
  },
  shoes: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: String,
    image: String,
    price: Number,
    category: String,
  },
  accessories: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: String,
    image: String,
    price: Number,
    category: String,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  discountedPrice: {
    type: Number,
    required: true,
  },
  savings: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const homeContentSchema = mongoose.Schema({
  sectionType: {
    type: String,
    required: true,
    enum: ['hero', 'collections', 'featured-suits', 'perfect-combinations'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  heroSlides: [heroSlideSchema],
  collections: [collectionSchema],
  featuredSuits: [featuredSuitSchema],
  perfectCombinations: [perfectCombinationSchema],
  settings: {
    heroAutoplay: {
      type: Boolean,
      default: true,
    },
    heroInterval: {
      type: Number,
      default: 5000,
    },
    maxCollections: {
      type: Number,
      default: 6,
    },
    maxFeaturedSuits: {
      type: Number,
      default: 4,
    },
    maxPerfectCombinations: {
      type: Number,
      default: 4,
    },
  },
}, {
  timestamps: true,
});

const HomeContent = mongoose.model('HomeContent', homeContentSchema);

export default HomeContent; 