import mongoose from 'mongoose';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const verifyAdmin = async () => {
  try {
    // Check for admin user from users.js
    const adminUser = await User.findOne({ email: 'admin@email.com' });
    
    if (adminUser) {
      console.log('✅ Admin user found!');
      console.log(`📧 Email: ${adminUser.email}`);
      console.log(`👑 Name: ${adminUser.name}`);
      console.log(`🔐 Admin Status: ${adminUser.isAdmin}`);
      console.log('🔑 Password: 123456');
      
      if (!adminUser.isAdmin) {
        console.log('⚠️  User exists but is not admin. Updating...');
        adminUser.isAdmin = true;
        await adminUser.save();
        console.log('✅ User updated to admin status!');
      }
      
      console.log('\n🎯 Login Instructions:');
      console.log('1. Go to /login in your browser');
      console.log('2. Use these credentials:');
      console.log('   📧 Email: admin@email.com');
      console.log('   🔑 Password: 123456');
      console.log('3. After login, you can access admin features');
      
    } else {
      console.log('❌ Admin user not found');
      console.log('💡 Suggestion: Run "node backend/seeder.js -i" to create admin user');
    }
    
    // Show all admin users
    const allAdmins = await User.find({ isAdmin: true });
    console.log(`\n👑 Total admin users in database: ${allAdmins.length}`);
    allAdmins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

verifyAdmin(); 