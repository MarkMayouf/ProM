import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import connectDB from './config/db.js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fixDatabase = async () => {
  try {
    await connectDB();
    
    // Get the database
    const db = mongoose.connection.db;
    
    // Drop the entire users collection
    await db.collection('users').drop().catch(err => {
      if (err.code !== 26) { // 26 is collection doesn't exist
        throw err;
      }
    });
    
    // Drop the entire products collection
    await db.collection('products').drop().catch(err => {
      if (err.code !== 26) {
        throw err;
      }
    });
    
    // Drop the entire orders collection
    await db.collection('orders').drop().catch(err => {
      if (err.code !== 26) {
        throw err;
      }
    });

    console.log('Collections dropped successfully'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

fixDatabase(); 