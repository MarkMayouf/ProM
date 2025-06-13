import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/productModel.js';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const updateProductImages = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected'.green);

    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`.cyan);

    let updatedCount = 0;

    for (const product of products) {
      let needsUpdate = false;
      const updates = {};

      // Fix main image path
      if (product.image) {
        let fixedImage = product.image;
        
        // Fix various incorrect paths
        if (fixedImage.startsWith('/9.jpg') || fixedImage === '9.jpg') {
          fixedImage = '/images/sample.jpg';
          needsUpdate = true;
        } else if (fixedImage.startsWith('/uploads/')) {
          // Move from uploads to images
          const filename = path.basename(fixedImage);
          fixedImage = `/images/${filename}`;
          needsUpdate = true;
        } else if (!fixedImage.startsWith('/images/') && !fixedImage.startsWith('http')) {
          // Add /images/ prefix if missing
          if (fixedImage.startsWith('/')) {
            fixedImage = `/images${fixedImage}`;
          } else {
            fixedImage = `/images/${fixedImage}`;
          }
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          updates.image = fixedImage;
          console.log(`${product.name}: ${product.image} → ${fixedImage}`.yellow);
        }
      } else {
        // Set default image if missing
        updates.image = '/images/sample.jpg';
        needsUpdate = true;
        console.log(`${product.name}: No image → /images/sample.jpg`.yellow);
      }

      // Fix images array
      if (product.images && product.images.length > 0) {
        const fixedImages = product.images.map(img => {
          let fixedImg = img;
          
          if (fixedImg.startsWith('/9.jpg') || fixedImg === '9.jpg') {
            return '/images/sample.jpg';
          } else if (fixedImg.startsWith('/uploads/')) {
            const filename = path.basename(fixedImg);
            return `/images/${filename}`;
          } else if (!fixedImg.startsWith('/images/') && !fixedImg.startsWith('http')) {
            if (fixedImg.startsWith('/')) {
              return `/images${fixedImg}`;
            } else {
              return `/images/${fixedImg}`;
            }
          }
          
          return fixedImg;
        });

        // Check if any images were changed
        const imagesChanged = JSON.stringify(product.images) !== JSON.stringify(fixedImages);
        if (imagesChanged) {
          updates.images = fixedImages;
          needsUpdate = true;
          console.log(`${product.name}: Updated ${fixedImages.length} additional images`.cyan);
        }
      }

      // Update the product if needed
      if (needsUpdate) {
        await Product.findByIdAndUpdate(product._id, updates);
        updatedCount++;
        console.log(`✅ Updated: ${product.name}`.green);
      } else {
        console.log(`✓ OK: ${product.name}`.gray);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} products`.green.inverse);
    console.log(`✓ ${products.length - updatedCount} products were already correct`.cyan);

    // Show summary of all product images
    const updatedProducts = await Product.find({}).select('name image category');
    console.log('\n📋 Product Image Summary:'.cyan.bold);
    updatedProducts.forEach(product => {
      console.log(`  ${product.category.padEnd(12)} | ${product.name.padEnd(30)} | ${product.image}`.white);
    });

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error}`.red.inverse);
    process.exit(1);
  }
};

updateProductImages(); 