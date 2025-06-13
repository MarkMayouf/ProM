import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import User from '../models/userModel.js';
import connectDB from '../config/db.js';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createAdminUser = async () => {
  try {
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@promayouf.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!'.yellow.inverse);
      console.log(`Email: admin@promayouf.com`);
      console.log(`Admin Status: ${existingAdmin.isAdmin}`);
      
      // Update to admin if not already
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        console.log('User updated to admin status!'.green.inverse);
      }
      
      process.exit();
    }

    // Create new admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@promayouf.com',
      password: 'admin123',
      isAdmin: true,
    });

    console.log('Admin user created successfully!'.green.inverse);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: admin123`);
    console.log(`Admin Status: ${adminUser.isAdmin}`);
    console.log('');
    console.log('You can now login with these credentials to access the content management system.'.cyan);
    
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const updateExistingUserToAdmin = async (email) => {
  try {
    await connectDB();

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User with email ${email} not found!`.red.inverse);
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();

    console.log(`User ${email} updated to admin status!`.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

// Check command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
  const command = args[0];
  
  if (command === 'update' && args[1]) {
    // Update existing user to admin
    updateExistingUserToAdmin(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node createAdmin.js                    - Create new admin user');
    console.log('  node createAdmin.js update <email>     - Update existing user to admin');
    process.exit(1);
  }
} else {
  // Create new admin user
  createAdminUser();
} 