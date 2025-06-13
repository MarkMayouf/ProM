const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Models
const Product = require('../models/productModel');

// Connect to DB
const run = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected');

    // Get all products
    const products = await Product.find({});
    
    console.log(`Found ${products.length} products:`);
    
    // Group by category
    const categories = {};
    
    products.forEach(product => {
      const category = product.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({
        id: product._id,
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        price: product.price
      });
    });
    
    // Display products by category
    Object.keys(categories).forEach(category => {
      console.log(`\n===== ${category} (${categories[category].length}) =====`);
      categories[category].forEach(product => {
        console.log(`- ${product.name} | ${product.subCategory || 'no subcategory'} | $${product.price}`);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

run(); 