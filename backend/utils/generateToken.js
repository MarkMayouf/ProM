import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRE } from '../config/config.js';

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });

  // Set JWT as HTTP-Only cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

export default generateToken;