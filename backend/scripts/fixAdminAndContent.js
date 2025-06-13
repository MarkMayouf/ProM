import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/promayouf');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

// Hero Slide Schema
const heroSlideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  badge: { type: String },
  link: { type: String },
  image: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

// Category Content Schema
const categoryContentSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String, required: true },
  count: { type: String, default: '' },
  subcategories: [{
    name: { type: String, required: true },
    link: { type: String, required: true }
  }],
  featured: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    link: { type: String, default: '' }
  },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);
const CategoryContent = mongoose.model('CategoryContent', categoryContentSchema);

const fixAdminAndContent = async () => {
  try {
    await connectDB();

    // 1. Create/Update admin user for admin@email.com
    console.log('\n🔧 Fixing admin user...');
    
    let adminUser = await User.findOne({ email: 'admin@email.com' });
    
    if (adminUser) {
      console.log('✅ Found existing user:', adminUser.email);
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log('✅ Updated to admin privileges');
    } else {
      console.log('❌ User admin@email.com not found. Creating...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@email.com',
        password: hashedPassword,
        isAdmin: true
      });
      
      await adminUser.save();
      console.log('✅ Created admin user: admin@email.com / admin123');
    }

    // 2. Also ensure admin@promayouf.com exists
    let promayoufAdmin = await User.findOne({ email: 'admin@promayouf.com' });
    
    if (!promayoufAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      promayoufAdmin = new User({
        name: 'Admin User',
        email: 'admin@promayouf.com',
        password: hashedPassword,
        isAdmin: true
      });
      
      await promayoufAdmin.save();
      console.log('✅ Created backup admin user: admin@promayouf.com / admin123');
    }

    // 3. Create content data
    console.log('\n🎭 Creating hero slides...');
    
    await HeroSlide.deleteMany({});
    
    const heroSlides = [
      {
        title: 'Refined Elegance For Every Occasion',
        description: 'Explore our new collection of premium suits designed for the modern gentleman.',
        badge: 'New Arrivals',
        link: '/category/suits',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop',
        isActive: true,
        order: 1,
      },
      {
        title: 'Summer Sale Up To 50% Off',
        description: "Limited time offers on select styles and accessories. Shop now before they're gone.",
        badge: 'Limited Time',
        link: '/sale',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
        isActive: true,
        order: 2,
      },
    ];

    await HeroSlide.insertMany(heroSlides);
    console.log('✅ Created 2 hero slides');

    // 4. Create categories
    console.log('\n🛍️ Creating categories...');
    
    await CategoryContent.deleteMany({});
    
    const categories = [
      {
        id: 'Suits',
        name: 'Suits',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop',
        description: 'Premium suits for every occasion, tailored to perfection.',
        link: 'Suits',
        count: '150+ Items',
        subcategories: [
          { name: 'Business Suits', link: 'Suits?subcategory=business' },
          { name: 'Wedding Suits', link: 'Suits?subcategory=wedding' },
          { name: 'Formal Suits', link: 'Suits?subcategory=formal' },
          { name: 'Casual Suits', link: 'Suits?subcategory=casual' },
        ],
        featured: {
          title: 'Executive Collection',
          description: 'Premium suits for the modern professional.',
          link: 'Suits?subcategory=business',
        },
        isActive: true,
        order: 1,
      },
      {
        id: 'Shoes',
        name: 'Shoes',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
        description: 'Elevate your style with our exclusive footwear collection.',
        link: 'Shoes',
        count: '80+ Items',
        subcategories: [
          { name: 'Oxford Shoes', link: 'Shoes?subcategory=oxford' },
          { name: 'Derby Shoes', link: 'Shoes?subcategory=derby' },
          { name: 'Loafers', link: 'Shoes?subcategory=loafers' },
          { name: 'Boots', link: 'Shoes?subcategory=boots' },
        ],
        featured: {
          title: 'Premium Leather',
          description: 'Handcrafted from the finest materials.',
          link: 'Shoes?subcategory=oxford',
        },
        isActive: true,
        order: 2,
      },
      {
        id: 'Accessories',
        name: 'Accessories',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
        description: 'Complete your look with our fine selection of accessories.',
        link: 'Accessories',
        count: '200+ Items',
        subcategories: [
          { name: 'Ties', link: 'Accessories?subcategory=ties' },
          { name: 'Belts', link: 'Accessories?subcategory=belts' },
          { name: 'Cufflinks', link: 'Accessories?subcategory=cufflinks' },
          { name: 'Pocket Squares', link: 'Accessories?subcategory=pocketsquares' },
        ],
        featured: {
          title: 'Gift Sets',
          description: 'Perfect combinations for any occasion.',
          link: 'Accessories?subcategory=gift-sets',
        },
        isActive: true,
        order: 3,
      },
    ];

    await CategoryContent.insertMany(categories);
    console.log('✅ Created 3 categories');

    // 5. Verify everything
    console.log('\n📊 Final Status:');
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ isAdmin: true });
    const heroCount = await HeroSlide.countDocuments();
    const categoryCount = await CategoryContent.countDocuments();

    console.log(`👥 Total users: ${userCount}`);
    console.log(`👑 Admin users: ${adminCount}`);
    console.log(`🎭 Hero slides: ${heroCount}`);
    console.log(`🛍️ Categories: ${categoryCount}`);

    console.log('\n🎉 SUCCESS! Everything is now set up:');
    console.log('1. Login with: admin@email.com (your current account)');
    console.log('2. Or login with: admin@promayouf.com / admin123');
    console.log('3. Navigate to: http://localhost:3000/admin/content');
    console.log('4. You should see Hero Section (2 slides) and Shop Collections (3 categories)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

fixAdminAndContent(); 