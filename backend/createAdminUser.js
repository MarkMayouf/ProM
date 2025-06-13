import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import connectDB from './config/db.js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

connectDB();

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@email.com' });
    
    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit();
    }
    
    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@email.com',
      password: bcrypt.hashSync('123456', 10),
      isAdmin: true,
    });
    
    if (adminUser) {
      console.log('Admin user created successfully!');
      console.log('Email: admin@email.com');
      console.log('Password: 123456');
    } else {
      console.log('Failed to create admin user');
    }
    
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

createAdminUser(); 