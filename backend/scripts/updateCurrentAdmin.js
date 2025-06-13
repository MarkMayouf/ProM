import mongoose from 'mongoose';
import User from '../models/userModel.js';
import HeroSlide from '../models/heroSlideModel.js';
import CategoryContent from '../models/categoryContentModel.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/promayouf')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const updateCurrentAdmin = async () => {
  try {
    // Update the current admin user
    const currentAdmin = await User.findOne({ email: 'admin@email.com' });
    
    if (currentAdmin) {
      console.log('✅ Found current admin user:', currentAdmin.email);
      currentAdmin.isAdmin = true;
      await currentAdmin.save();
      console.log('✅ Updated admin permissions for:', currentAdmin.email);
    } else {
      console.log('❌ Current admin user (admin@email.com) not found');
    }
    
    // Check content data
    const heroCount = await HeroSlide.countDocuments();
    const categoryCount = await CategoryContent.countDocuments();
    
    console.log('\n📊 Content Status:');
    console.log('🎭 Hero Slides:', heroCount);
    console.log('🛍️ Categories:', categoryCount);
    
    if (heroCount === 0 || categoryCount === 0) {
      console.log('⚠️  Content data missing. Please run: node seeder/contentSeeder.js');
    } else {
      console.log('✅ Content data is available');
    }
    
    // List all admin users
    const adminUsers = await User.find({ isAdmin: true });
    console.log('\n👑 Admin Users:');
    adminUsers.forEach(admin => {
      console.log(`  - ${admin.name} (${admin.email})`);
    });
    
    console.log('\n🎯 You can now access content management with either:');
    console.log('1. admin@email.com (your current account)');
    console.log('2. admin@promayouf.com / admin123');
    console.log('\n🔗 URL: http://localhost:3000/admin/content');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

updateCurrentAdmin(); 