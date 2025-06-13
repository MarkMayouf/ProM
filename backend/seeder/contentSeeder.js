import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import HeroSlide from '../models/heroSlideModel.js';
import CategoryContent from '../models/categoryContentModel.js';
import connectDB from '../config/db.js';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

const importData = async () => {
  try {
    await connectDB();

    await HeroSlide.deleteMany();
    await CategoryContent.deleteMany();

    await HeroSlide.insertMany(heroSlides);
    await CategoryContent.insertMany(categories);

    console.log('Content data imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();

    await HeroSlide.deleteMany();
    await CategoryContent.deleteMany();

    console.log('Content data destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
} 