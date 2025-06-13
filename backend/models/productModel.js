import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const sizeSchema = mongoose.Schema({
  size: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  }
});

const productSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(images) {
        return images.length <= 10; // Maximum 10 images
      },
      message: 'Maximum 10 images allowed per product'
    }
  },
  brand: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts', 'Shirts', 'Accessories', 'Shoes'],
  },
  subCategory: {
    type: String,
    required: function() {
      return this.category !== 'Accessories';
    }
  },
  description: {
    type: String,
    required: true,
  },
  reviews: [reviewSchema],
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
  numReviews: {
    type: Number,
    required: true,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  regularPrice: {
    type: Number,
    default: function() {
      return this.price;
    }
  },
  countInStock: {
    type: Number,
    required: true,
    default: 0,
  },
  sizes: {
    type: [sizeSchema],
    required: function() {
      return ['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts', 'Shirts', 'Shoes'].includes(this.category);
    },
    validate: {
      validator: function(sizes) {
        if (this.category === 'Accessories') return true;
        return sizes && sizes.length > 0;
      },
      message: 'Sizes are required for non-accessory products'
    }
  },
  color: {
    type: String,
    required: true,
  },
  material: {
    type: String,
    required: true,
  },
  fit: {
    type: String,
    required: function() {
      return ['Suits', 'Tuxedos', 'Blazers', 'Dress Shirts', 'Shirts'].includes(this.category);
    },
    enum: ['Regular', 'Slim', 'Relaxed'],
  },
  style: {
    type: String,
    required: true,
    enum: ['Business', 'Casual', 'Sport'],
  },
  pieces: {
    type: Number,
    required: function() {
      return ['Suits', 'Tuxedos'].includes(this.category);
    },
    enum: [2, 3],
    default: 2
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number,
    required: function() {
      return this.isOnSale;
    }
  },
  saleStartDate: {
    type: Date,
    required: function() {
      return this.isOnSale;
    }
  },
  saleEndDate: {
    type: Date,
    required: function() {
      return this.isOnSale;
    }
  }
}, {
  timestamps: true,
});

productSchema.methods.updateStock = function() {
  if (this.sizes && this.sizes.length > 0) {
    this.countInStock = this.sizes.reduce((total, size) => total + size.quantity, 0);
  }
};

const Product = mongoose.model('Product', productSchema);

export default Product;