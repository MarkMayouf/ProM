import mongoose from 'mongoose';
import User from '../models/userModel.js';
import HeroSlide from '../models/heroSlideModel.js';
import CategoryContent from '../models/categoryContentModel.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/promayouf')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const diagnosticCheck = async () => {
  try {
    console.log('\n🔍 DIAGNOSTIC CHECK - Database Collections\n');

    // Check all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available Collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Check users
    console.log('\n👥 USERS:');
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Admin: ${user.isAdmin}`);
    });

    // Check hero slides
    console.log('\n🎭 HERO SLIDES:');
    const heroSlides = await HeroSlide.find({});
    console.log(`Total hero slides: ${heroSlides.length}`);
    heroSlides.forEach(slide => {
      console.log(`  - ${slide.title} (Active: ${slide.isActive})`);
    });

    // Check categories with detailed info
    console.log('\n🛍️ CATEGORIES:');
    const categories = await CategoryContent.find({});
    console.log(`Total categories: ${categories.length}`);
    
    if (categories.length === 0) {
      console.log('❌ No categories found! Let me check the raw collection...');
      
      // Check raw collection
      const rawCategories = await mongoose.connection.db.collection('categorycontents').find({}).toArray();
      console.log(`Raw categorycontents collection count: ${rawCategories.length}`);
      
      if (rawCategories.length > 0) {
        console.log('Raw categories found:');
        rawCategories.forEach(cat => {
          console.log(`  - ${cat.name} (ID: ${cat._id})`);
        });
      }
    } else {
      categories.forEach(category => {
        console.log(`  - ${category.name} (Active: ${category.isActive})`);
      });
    }

    // Test the API endpoints
    console.log('\n🔗 TESTING API QUERIES:');
    
    try {
      const heroSlidesAdmin = await HeroSlide.find({}).sort({ order: 1, createdAt: -1 });
      console.log(`Hero slides admin query: ${heroSlidesAdmin.length} results`);
    } catch (err) {
      console.log(`❌ Hero slides admin query error: ${err.message}`);
    }

    try {
      const categoriesAdmin = await CategoryContent.find({}).sort({ order: 1, createdAt: -1 });
      console.log(`Categories admin query: ${categoriesAdmin.length} results`);
    } catch (err) {
      console.log(`❌ Categories admin query error: ${err.message}`);
    }

    // Check if there are any validation errors
    console.log('\n🧪 TESTING CATEGORY CREATION:');
    try {
      const testCategory = new CategoryContent({
        name: 'Test Category',
        image: 'https://example.com/test.jpg',
        description: 'Test description',
        link: 'test',
        count: '1 Item',
        isActive: true,
        order: 999
      });
      
      await testCategory.validate();
      console.log('✅ Category validation passed');
      
      // Don't save, just test validation
    } catch (err) {
      console.log(`❌ Category validation error: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

diagnosticCheck(); 