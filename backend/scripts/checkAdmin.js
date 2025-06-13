import mongoose from 'mongoose';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/promayouf')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const checkAndCreateAdmin = async () => {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@promayouf.com' });
    
    if (adminExists) {
      console.log('✅ Admin user exists:', {
        name: adminExists.name,
        email: adminExists.email,
        isAdmin: adminExists.isAdmin
      });
      
      if (!adminExists.isAdmin) {
        console.log('⚠️  User exists but is not admin. Updating...');
        adminExists.isAdmin = true;
        await adminExists.save();
        console.log('✅ User updated to admin');
      }
    } else {
      console.log('❌ Admin user not found. Creating...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const admin = new User({
        name: 'Admin User',
        email: 'admin@promayouf.com',
        password: hashedPassword,
        isAdmin: true
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully');
      console.log('📧 Email: admin@promayouf.com');
      console.log('🔑 Password: admin123');
    }
    
    // Check total users
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ isAdmin: true });
    console.log('📊 Total users in database:', userCount);
    console.log('👑 Total admin users:', adminCount);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Login with: admin@promayouf.com / admin123');
    console.log('2. Navigate to: http://localhost:3000/admin/content');
    console.log('3. You should see Hero Section and Shop Collections tabs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

checkAndCreateAdmin(); 