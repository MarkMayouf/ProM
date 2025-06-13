import mongoose from 'mongoose';
import User from '../models/userModel.js';
import HeroSlide from '../models/heroSlideModel.js';
import CategoryContent from '../models/categoryContentModel.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/promayouf');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const simpleDiagnostic = async () => {
  try {
    await connectDB();

    console.log('\n🔍 CHECKING DATABASE CONTENT\n');

    // Check users
    const users = await User.find({});
    console.log(`👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Admin: ${user.isAdmin}`);
    });

    // Check hero slides
    const heroSlides = await HeroSlide.find({});
    console.log(`\n🎭 Hero Slides: ${heroSlides.length}`);
    heroSlides.forEach(slide => {
      console.log(`  - ${slide.title}`);
    });

    // Check categories
    const categories = await CategoryContent.find({});
    console.log(`\n🛍️ Categories: ${categories.length}`);
    
    if (categories.length === 0) {
      console.log('❌ No categories found!');
      
      // Try to create categories directly
      console.log('\n🔧 Creating categories now...');
      
      const categoryData = [
        {
          name: 'Suits',
          image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
          description: 'Premium suits for every occasion, tailored to perfection.',
          link: 'Suits',
          count: '150+ Items',
          isActive: true,
          order: 1,
        },
        {
          name: 'Shoes',
          image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
          description: 'Elevate your style with our exclusive footwear collection.',
          link: 'Shoes',
          count: '80+ Items',
          isActive: true,
          order: 2,
        },
        {
          name: 'Accessories',
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
          description: 'Complete your look with our fine selection of accessories.',
          link: 'Accessories',
          count: '200+ Items',
          isActive: true,
          order: 3,
        },
      ];

      try {
        await CategoryContent.insertMany(categoryData);
        console.log('✅ Categories created successfully!');
        
        // Verify
        const newCategories = await CategoryContent.find({});
        console.log(`✅ Verification: ${newCategories.length} categories now exist`);
        newCategories.forEach(cat => {
          console.log(`  - ${cat.name}`);
        });
        
      } catch (err) {
        console.log('❌ Error creating categories:', err.message);
      }
    } else {
      categories.forEach(category => {
        console.log(`  - ${category.name} (Active: ${category.isActive})`);
      });
    }

    console.log('\n🎯 FINAL STATUS:');
    const finalHeroCount = await HeroSlide.countDocuments();
    const finalCategoryCount = await CategoryContent.countDocuments();
    console.log(`Hero Slides: ${finalHeroCount}`);
    console.log(`Categories: ${finalCategoryCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

simpleDiagnostic(); 