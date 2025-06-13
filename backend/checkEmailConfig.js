#!/usr/bin/env node

/**
 * Email Configuration Checker
 * Run this script to check your email configuration
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🔍 ProMayouf Email Configuration Check\n');

// Check Node environment
console.log(`📊 Environment: ${process.env.NODE_ENV || 'Not set (defaults to development)'}`);

// Check email configurations
let emailConfigFound = false;

if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
  console.log('✅ Gmail configuration found');
  console.log(`   📧 Email: ${process.env.GMAIL_EMAIL}`);
  console.log(`   🔑 App Password: ${'*'.repeat(process.env.GMAIL_APP_PASSWORD.length)}`);
  emailConfigFound = true;
} else if (process.env.SMTP_HOST) {
  console.log('✅ Custom SMTP configuration found');
  console.log(`   🌐 Host: ${process.env.SMTP_HOST}`);
  console.log(`   🔌 Port: ${process.env.SMTP_PORT || '587 (default)'}`);
  console.log(`   👤 User: ${process.env.SMTP_EMAIL || 'Not set'}`);
  console.log(`   🔑 Password: ${process.env.SMTP_PASSWORD ? '*'.repeat(8) : 'Not set'}`);
  emailConfigFound = true;
}

if (!emailConfigFound) {
  console.log('ℹ️  No email configuration found - using development mock mode');
  console.log('   📝 Verification codes will be logged to console');
  console.log('   ✅ Registration will work normally');
}

// Check sender information
if (process.env.FROM_EMAIL) {
  console.log(`📤 From Email: ${process.env.FROM_EMAIL}`);
}
if (process.env.FROM_NAME) {
  console.log(`👤 From Name: ${process.env.FROM_NAME}`);
}

console.log('\n📋 Setup Instructions:');
console.log('   1. See EMAIL_SETUP.md for detailed configuration');
console.log('   2. Create .env file in backend directory (if not exists)');
console.log('   3. Add your email configuration');
console.log('   4. Restart the server');

console.log('\n🚀 Quick Start (No Setup Required):');
console.log('   - The system works without email configuration');
console.log('   - Verification codes appear in server console');
console.log('   - Perfect for development and testing');

export {}; 