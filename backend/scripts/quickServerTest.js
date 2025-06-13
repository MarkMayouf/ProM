import express from 'express';
import mongoose from 'mongoose';
import CategoryContent from '../models/categoryContentModel.js';
import HeroSlide from '../models/heroSlideModel.js';

const testServer = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/promayouf');
    console.log('✅ Connected to MongoDB');

    // Test direct database queries
    const categories = await CategoryContent.find({}).sort({ order: 1, createdAt: -1 });
    const heroSlides = await HeroSlide.find({}).sort({ order: 1, createdAt: -1 });

    console.log('\n📊 Direct Database Results:');
    console.log(`Hero Slides: ${heroSlides.length}`);
    heroSlides.forEach(slide => {
      console.log(`  - ${slide.title}`);
    });

    console.log(`Categories: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (Active: ${cat.isActive})`);
    });

    // Create a simple test server
    const app = express();
    app.use(express.json());

    // Test route without auth
    app.get('/test/categories', async (req, res) => {
      try {
        const categories = await CategoryContent.find({}).sort({ order: 1, createdAt: -1 });
        res.json(categories);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    const server = app.listen(3001, () => {
      console.log('\n🚀 Test server running on port 3001');
      console.log('Test URL: http://localhost:3001/test/categories');
      
      // Auto-close after 30 seconds
      setTimeout(() => {
        console.log('\n⏰ Closing test server...');
        server.close();
        mongoose.connection.close();
        process.exit(0);
      }, 30000);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testServer(); 