import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import authRoutes from './routes/authRoutes.js';
import homeContentRoutes from './routes/homeContentRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import initializeFirebase from './config/firebase.js';

import {
  notFound,
  errorHandler
} from './middleware/errorMiddleware.js';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from backend directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
// IMPORTANT: Force port 5001 for development
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 5000) : 5001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Firebase Admin
initializeFirebase();

// Configure CORS with specific options
app.use(cors({
  origin: ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'frontend', 'public', 'uploads');
const imagesDir = path.join(__dirname, '..', 'frontend', 'public', 'images');

// Ensure directories exist
[uploadsDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve uploaded files with proper headers and error handling
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(uploadsDir));

// Serve static images with proper headers and fallback
app.use('/images', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  
  // Check if file exists, if not serve a default image
  const requestedFile = path.join(imagesDir, req.path);
  if (!fs.existsSync(requestedFile)) {
    // Try to serve sample.jpg as fallback
    const fallbackFile = path.join(imagesDir, 'sample.jpg');
    if (fs.existsSync(fallbackFile)) {
      return res.sendFile(fallbackFile);
    } else {
      // If no fallback exists, continue to 404
      return next();
    }
  }
  
  next();
}, express.static(imagesDir));

// Log all requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/home-content', homeContentRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/otp', otpRoutes);


// PayPal client ID
app.get('/api/config/paypal', (req, res) =>
  res.send({
    clientId: process.env.PAYPAL_CLIENT_ID || 'sb'
  })
);

// WebSocket upgrade handling
app.on('upgrade', (request, socket, head) => {
  console.log('[WebSocket] Upgrade request received');
  // Handle WebSocket upgrade here if needed
});

// Serve frontend production build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/build')));
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB and start server with better error handling
const startServer = async () => {
  try {
    await connectDB();

    // Create server instance
    const server = app.listen(port, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
      console.log(`Server URL: http://localhost:${port}`);
      console.log(`Uploads directory: ${uploadsDir}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please free up the port and try again.`);
        // Exit with error code
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received. Closing server...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received. Closing server...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});