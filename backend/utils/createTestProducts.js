const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');

// Load env vars from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Models
const Product = require('../models/productModel');
const User = require('../models/userModel');

// Connect to DB
const run = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected');

    // Find admin user
    const adminUser = await User.findOne({ isAdmin: true });
    
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }
    
    console.log('Admin user found: ' + adminUser.name);
    
    // Suits
    const suit1 = new Product({
      user: adminUser._id,
      name: 'Classic Navy Blue Suit',
      image: '/images/navy-blue-suit.jpg',
      description: 'Premium navy blue wool suit perfect for business meetings and formal occasions.',
      brand: 'ProMayouf Signature',
      category: 'Suits',
      subCategory: 'business',
      price: 599.99,
      countInStock: 50,
      rating: 4.5,
      numReviews: 12,
      color: 'Navy Blue',
      material: 'Wool Blend',
      fit: 'Regular',
      style: 'Business',
      pieces: 2,
      isOnSale: false
    });
    
    const suit2 = new Product({
      user: adminUser._id,
      name: 'Formal Black Tuxedo',
      image: '/images/black-tuxedo.jpg',
      description: 'Elegant black tuxedo for formal events and black tie occasions.',
      brand: 'ProMayouf Elite',
      category: 'Suits',
      subCategory: 'formal',
      price: 799.99,
      countInStock: 30,
      rating: 4.8,
      numReviews: 8,
      color: 'Black',
      material: 'Premium Wool',
      fit: 'Slim',
      style: 'Formal',
      pieces: 3,
      isOnSale: false
    });
    
    // Shoes
    const shoes1 = new Product({
      user: adminUser._id,
      name: 'Classic Oxford Dress Shoes',
      image: '/images/oxford-shoes.jpg',
      description: 'Premium leather oxford dress shoes perfect for formal occasions.',
      brand: 'ProMayouf Footwear',
      category: 'Shoes',
      subCategory: 'formal',
      price: 249.99,
      countInStock: 40,
      rating: 4.6,
      numReviews: 15,
      color: 'Black',
      material: 'Leather',
      fit: 'Regular',
      style: 'Formal',
      pieces: 1,
      isOnSale: false
    });
    
    const shoes2 = new Product({
      user: adminUser._id,
      name: 'Casual Leather Loafers',
      image: '/images/leather-loafers.jpg',
      description: 'Comfortable leather loafers suitable for business casual attire.',
      brand: 'ProMayouf Comfort',
      category: 'Shoes',
      subCategory: 'casual',
      price: 179.99,
      countInStock: 60,
      rating: 4.3,
      numReviews: 22,
      color: 'Brown',
      material: 'Leather',
      fit: 'Wide',
      style: 'Casual',
      pieces: 1,
      isOnSale: true
    });
    
    // Accessories
    const accessory1 = new Product({
      user: adminUser._id,
      name: 'Silk Necktie',
      image: '/images/silk-tie.jpg',
      description: 'Premium silk necktie with elegant pattern design.',
      brand: 'ProMayouf Essentials',
      category: 'Accessories',
      subCategory: 'ties',
      price: 59.99,
      countInStock: 100,
      rating: 4.7,
      numReviews: 30,
      color: 'Blue Striped',
      material: 'Silk',
      fit: 'Regular',
      style: 'Business',
      pieces: 1,
      isOnSale: false
    });
    
    const accessory2 = new Product({
      user: adminUser._id,
      name: 'Leather Belt',
      image: '/images/leather-belt.jpg',
      description: 'Classic leather belt with brushed metal buckle.',
      brand: 'ProMayouf Leather',
      category: 'Accessories',
      subCategory: 'belts',
      price: 79.99,
      countInStock: 80,
      rating: 4.5,
      numReviews: 25,
      color: 'Black',
      material: 'Full Grain Leather',
      fit: 'Regular',
      style: 'Business',
      pieces: 1,
      isOnSale: false
    });
    
    console.log('Saving products...');
    
    await suit1.save();
    console.log('Saved suit 1');
    
    await suit2.save();
    console.log('Saved suit 2');
    
    await shoes1.save();
    console.log('Saved shoes 1');
    
    await shoes2.save();
    console.log('Saved shoes 2');
    
    await accessory1.save();
    console.log('Saved accessory 1');
    
    await accessory2.save();
    console.log('Saved accessory 2');
    
    console.log('All test products created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

run(); 