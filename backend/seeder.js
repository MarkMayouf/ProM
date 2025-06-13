import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';
import users from './data/users.js';
import products from './data/products.js';
import User from './models/userModel.js';
import Product from './models/productModel.js';
import Order from './models/orderModel.js';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Additional test products
const testProducts = [
  // Suits
  {
    name: 'Classic Navy Blue Suit',
    image: '/images/navy-blue-suit.jpg',
    description: 'Premium navy blue wool suit perfect for business meetings and formal occasions.',
    brand: 'ProMayouf Signature',
    category: 'Suits',
    subCategory: 'business',
    price: 599.99,
    countInStock: 50,
    rating: 4.5,
    numReviews: 12,
    color: 'Navy Blue',
    material: 'Wool Blend',
    fit: 'Regular',
    style: 'Business',
    pieces: 2,
    isOnSale: false,
    sizes: [{
        size: '40R',
        quantity: 10
      },
      {
        size: '42R',
        quantity: 10
      },
      {
        size: '44R',
        quantity: 10
      },
      {
        size: '46R',
        quantity: 10
      },
      {
        size: '48R',
        quantity: 10
      }
    ]
  },
  {
    name: 'Formal Black Tuxedo',
    image: '/images/black-tuxedo.jpg',
    description: 'Elegant black tuxedo for formal events and black tie occasions.',
    brand: 'ProMayouf Elite',
    category: 'Suits',
    subCategory: 'formal',
    price: 799.99,
    countInStock: 30,
    rating: 4.8,
    numReviews: 8,
    color: 'Black',
    material: 'Premium Wool',
    fit: 'Slim',
    style: 'Business',
    pieces: 3,
    isOnSale: false,
    sizes: [{
        size: '38R',
        quantity: 5
      },
      {
        size: '40R',
        quantity: 5
      },
      {
        size: '42R',
        quantity: 5
      },
      {
        size: '44R',
        quantity: 5
      },
      {
        size: '46R',
        quantity: 5
      }
    ]
  },
  // Shoes
  {
    name: 'Classic Oxford Dress Shoes',
    image: '/images/oxford-shoes.jpg',
    description: 'Premium leather oxford dress shoes perfect for formal occasions.',
    brand: 'ProMayouf Footwear',
    category: 'Shoes',
    subCategory: 'formal',
    price: 249.99,
    countInStock: 40,
    rating: 4.6,
    numReviews: 15,
    color: 'Black',
    material: 'Leather',
    fit: 'Regular',
    style: 'Business',
    isOnSale: false,
    sizes: [{
        size: '8',
        quantity: 8
      },
      {
        size: '9',
        quantity: 8
      },
      {
        size: '10',
        quantity: 8
      },
      {
        size: '11',
        quantity: 8
      },
      {
        size: '12',
        quantity: 8
      }
    ]
  },
  {
    name: 'Casual Leather Loafers',
    image: '/images/leather-loafers.jpg',
    description: 'Comfortable leather loafers suitable for business casual attire.',
    brand: 'ProMayouf Comfort',
    category: 'Shoes',
    subCategory: 'casual',
    price: 179.99,
    countInStock: 60,
    rating: 4.3,
    numReviews: 22,
    color: 'Brown',
    material: 'Leather',
    fit: 'Regular',
    style: 'Casual',
    isOnSale: false,
    sizes: [{
        size: '8',
        quantity: 12
      },
      {
        size: '9',
        quantity: 12
      },
      {
        size: '10',
        quantity: 12
      },
      {
        size: '11',
        quantity: 12
      },
      {
        size: '12',
        quantity: 12
      }
    ]
  },
  // Accessories
  {
    name: 'Silk Necktie',
    image: '/images/silk-tie.jpg',
    description: 'Premium silk necktie with elegant pattern design.',
    brand: 'ProMayouf Essentials',
    category: 'Accessories',
    subCategory: 'ties',
    price: 59.99,
    countInStock: 100,
    rating: 4.7,
    numReviews: 30,
    color: 'Blue Striped',
    material: 'Silk',
    fit: 'Regular',
    style: 'Business',
    isOnSale: false
  },
  {
    name: 'Leather Belt',
    image: '/images/leather-belt.jpg',
    description: 'Classic leather belt with brushed metal buckle.',
    brand: 'ProMayouf Leather',
    category: 'Accessories',
    subCategory: 'belts',
    price: 79.99,
    countInStock: 80,
    rating: 4.5,
    numReviews: 25,
    color: 'Black',
    material: 'Full Grain Leather',
    fit: 'Regular',
    style: 'Business',
    isOnSale: false
  }
];

dotenv.config({ path: path.resolve(__dirname, '../.env') });

connectDB();

const importData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    const createdUsers = await User.insertMany(users);

    const adminUser = createdUsers[0]._id;

    const sampleProducts = [...products, ...testProducts].map((product) => {
      return { ...product, user: adminUser };
    });

    await Product.insertMany(sampleProducts);

    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const addSuitsOnly = async () => {
  try {
    // Get the admin user
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.'.red);
      process.exit(1);
    }

    // Sample suits to add
    const suitsProducts = [
      {
        name: 'Classic Navy Business Suit',
        image: '/images/sample.jpg',
        description: 'Professional navy blue suit perfect for business meetings and formal occasions. Made from premium wool with a modern fit.',
        brand: 'ProMayouf',
        category: 'Suits',
        subCategory: 'business',
        price: 699.99,
        countInStock: 25,
        color: 'Navy Blue',
        material: 'Wool',
        fit: 'Regular',
        style: 'Business',
        pieces: 2,
        user: adminUser._id,
        rating: 4.5,
        numReviews: 12,
        sizes: [
          { size: '38R', quantity: 5 },
          { size: '40R', quantity: 8 },
          { size: '42R', quantity: 7 },
          { size: '44R', quantity: 5 }
        ]
      },
      {
        name: 'Charcoal Grey Wedding Suit',
        image: '/images/sample.jpg',
        description: 'Elegant charcoal grey suit perfect for weddings and special occasions. Features a slim fit design with premium construction.',
        brand: 'ProMayouf',
        category: 'Suits',
        subCategory: 'wedding',
        price: 799.99,
        countInStock: 20,
        color: 'Charcoal Grey',
        material: 'Wool Blend',
        fit: 'Slim',
        style: 'Business',
        pieces: 3,
        user: adminUser._id,
        rating: 4.7,
        numReviews: 8,
        sizes: [
          { size: '38R', quantity: 4 },
          { size: '40R', quantity: 6 },
          { size: '42R', quantity: 6 },
          { size: '44R', quantity: 4 }
        ]
      },
      {
        name: 'Black Formal Tuxedo',
        image: '/images/sample.jpg',
        description: 'Classic black tuxedo for formal events and black-tie occasions. Includes jacket and trousers with satin details.',
        brand: 'ProMayouf',
        category: 'Suits',
        subCategory: 'formal',
        price: 899.99,
        countInStock: 15,
        color: 'Black',
        material: 'Wool',
        fit: 'Regular',
        style: 'Business',
        pieces: 2,
        user: adminUser._id,
        rating: 4.8,
        numReviews: 15,
        sizes: [
          { size: '38R', quantity: 3 },
          { size: '40R', quantity: 5 },
          { size: '42R', quantity: 4 },
          { size: '44R', quantity: 3 }
        ]
      },
      {
        name: 'Light Grey Casual Suit',
        image: '/images/sample.jpg',
        description: 'Stylish light grey suit for casual business and social events. Made from breathable cotton blend fabric.',
        brand: 'ProMayouf',
        category: 'Suits',
        subCategory: 'casual',
        price: 599.99,
        countInStock: 30,
        color: 'Light Grey',
        material: 'Cotton Blend',
        fit: 'Slim',
        style: 'Casual',
        pieces: 2,
        user: adminUser._id,
        rating: 4.3,
        numReviews: 10,
        sizes: [
          { size: '38R', quantity: 7 },
          { size: '40R', quantity: 10 },
          { size: '42R', quantity: 8 },
          { size: '44R', quantity: 5 }
        ]
      },
      {
        name: 'Midnight Blue Evening Suit',
        image: '/images/sample.jpg',
        description: 'Sophisticated midnight blue suit perfect for evening events and formal dinners. Premium wool construction.',
        brand: 'ProMayouf',
        category: 'Suits',
        subCategory: 'formal',
        price: 749.99,
        countInStock: 18,
        color: 'Midnight Blue',
        material: 'Wool',
        fit: 'Regular',
        style: 'Business',
        pieces: 2,
        user: adminUser._id,
        rating: 4.6,
        numReviews: 14,
        sizes: [
          { size: '38R', quantity: 4 },
          { size: '40R', quantity: 6 },
          { size: '42R', quantity: 5 },
          { size: '44R', quantity: 3 }
        ]
      }
    ];

    // Check which suits already exist and add missing ones
    let addedCount = 0;
    
    for (const suitData of suitsProducts) {
      const existingSuit = await Product.findOne({ name: suitData.name });
      
      if (!existingSuit) {
        const newSuit = new Product(suitData);
        await newSuit.save();
        console.log(`✅ Added: ${suitData.name}`.green);
        addedCount++;
      } else {
        console.log(`⏭️  Skipped: ${suitData.name} (already exists)`.yellow);
      }
    }

    console.log(`\n✅ Added ${addedCount} new suits products!`.green.inverse);
    
    // Show final count by category
    const allProducts = await Product.find({});
    const categories = {};
    allProducts.forEach(product => {
      const category = product.category;
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category]++;
    });
    
    console.log('\nProducts by category:'.cyan);
    Object.keys(categories).forEach(category => {
      console.log(`  ${category}: ${categories[category]} products`.white);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error(`Error: ${error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else if (process.argv[2] === '-suits') {
  addSuitsOnly();
} else {
  importData();
}
