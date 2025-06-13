const products = [
  // SUITS SECTION
  {
    name: 'Classic Black Business Suit',
    image: '/images/classic-black-suit.jpg',
    images: [
      '/images/classic-black-suit.jpg',
      '/images/classic-black-suit-back.jpg',
      '/images/classic-black-suit-detail.jpg',
      '/images/classic-black-suit-model.jpg'
    ],
    description: 'Premium black wool suit perfect for business meetings and formal occasions. Features a timeless design with modern tailoring.',
    brand: 'ProMayouf Signature',
    category: 'Suits',
    subCategory: 'business',
    price: 419.99,
    regularPrice: 599.99,
    countInStock: 50,
    rating: 4.5,
    numReviews: 12,
    color: 'Black',
    material: 'Wool Blend',
    fit: 'Regular',
    style: 'Business',
    pieces: 2,
    isOnSale: true,
    salePrice: 419.99,
    saleStartDate: new Date('2024-01-01'),
    saleEndDate: new Date('2024-12-31'),
    sizes: [
      { size: '40R', quantity: 10 },
      { size: '42R', quantity: 10 },
      { size: '44R', quantity: 10 },
      { size: '46R', quantity: 10 },
      { size: '48R', quantity: 10 }
    ]
  },
  {
    name: 'Navy Blue Slim Fit Suit',
    image: '/images/navy-slim-suit.jpg',
    images: [
      '/images/navy-slim-suit.jpg',
      '/images/navy-slim-suit-back.jpg',
      '/images/navy-slim-suit-detail.jpg',
      '/images/navy-slim-suit-model.jpg'
    ],
    description: 'Modern navy blue suit with a slim fit cut. Perfect for young professionals and contemporary occasions.',
    brand: 'ProMayouf Modern',
    category: 'Suits',
    subCategory: 'business',
    price: 349.99,
    regularPrice: 499.99,
    countInStock: 45,
    rating: 4.0,
    numReviews: 8,
    color: 'Navy Blue',
    material: 'Wool Blend',
    fit: 'Slim',
    style: 'Business',
    pieces: 2,
    isOnSale: true,
    salePrice: 349.99,
    saleStartDate: new Date('2024-01-01'),
    saleEndDate: new Date('2024-12-31'),
    sizes: [
      { size: '38R', quantity: 15 },
      { size: '40R', quantity: 15 },
      { size: '42R', quantity: 15 }
    ]
  },
  {
    name: 'Grey Three-Piece Wedding Suit',
    image: '/images/grey-wedding-suit.jpg',
    images: [
      '/images/grey-wedding-suit.jpg',
      '/images/grey-wedding-suit-back.jpg',
      '/images/grey-wedding-suit-vest.jpg',
      '/images/grey-wedding-suit-model.jpg'
    ],
    description: 'Elegant grey three-piece suit perfect for weddings and special occasions. Includes vest for a complete formal look.',
    brand: 'ProMayouf Luxe',
    category: 'Suits',
    subCategory: 'wedding',
    price: 799.99,
    countInStock: 30,
    rating: 4.8,
    numReviews: 15,
    color: 'Light Grey',
    material: 'Pure Wool',
    fit: 'Regular',
    style: 'Business',
    pieces: 3,
    isOnSale: false,
    sizes: [
      { size: '40R', quantity: 6 },
      { size: '42R', quantity: 6 },
      { size: '44R', quantity: 6 },
      { size: '46R', quantity: 6 },
      { size: '48R', quantity: 6 }
    ]
  },
  {
    name: 'Black Peak Lapel Tuxedo',
    image: '/images/black-tuxedo.jpg',
    description: 'Sophisticated black tuxedo with peak lapels for formal events and black-tie occasions. Crafted with premium fabrics and impeccable tailoring.',
    brand: 'ProMayouf Luxe',
    category: 'Suits',
    subCategory: 'tuxedos',
    price: 899.99,
    countInStock: 25,
    rating: 4.9,
    numReviews: 18,
    color: 'Black',
    material: 'Pure Wool',
    fit: 'Slim',
    style: 'Business',
    pieces: 2,
    isOnSale: false,
    sizes: [
      { size: '38R', quantity: 5 },
      { size: '40R', quantity: 5 },
      { size: '42R', quantity: 5 },
      { size: '44R', quantity: 5 },
      { size: '46R', quantity: 5 }
    ]
  },
  {
    name: 'Pinstripe Formal Suit',
    image: '/images/pinstripe-suit.jpg',
    description: 'Classic pinstripe formal suit with traditional styling. Perfect for business meetings and formal occasions where you need to make an impression.',
    brand: 'ProMayouf Signature',
    category: 'Suits',
    subCategory: 'formal',
    price: 649.99,
    countInStock: 35,
    rating: 4.7,
    numReviews: 14,
    color: 'Navy/Pinstripe',
    material: 'Pure Wool',
    fit: 'Regular',
    style: 'Business',
    pieces: 2,
    isOnSale: false,
    sizes: [
      { size: '40R', quantity: 7 },
      { size: '42R', quantity: 7 },
      { size: '44R', quantity: 7 },
      { size: '46R', quantity: 7 },
      { size: '48R', quantity: 7 }
    ]
  },

  // SHOES SECTION
  {
    name: 'Classic Black Oxford Shoes',
    image: '/images/black-oxford-shoes.jpg',
    images: [
      '/images/black-oxford-shoes.jpg',
      '/images/black-oxford-shoes-side.jpg',
      '/images/black-oxford-shoes-sole.jpg'
    ],
    description: 'Premium leather Oxford shoes in classic black. Perfect for business and formal occasions.',
    brand: 'ProMayouf Footwear',
    category: 'Shoes',
    subCategory: 'oxford',
    price: 139.99,
    regularPrice: 199.99,
    countInStock: 100,
    rating: 4.6,
    numReviews: 25,
    color: 'Black',
    material: 'Genuine Leather',
    style: 'Business',
    isOnSale: true,
    salePrice: 139.99,
    saleStartDate: new Date('2024-01-01'),
    saleEndDate: new Date('2024-12-31'),
    sizes: [
      { size: '8', quantity: 20 },
      { size: '9', quantity: 20 },
      { size: '10', quantity: 20 },
      { size: '11', quantity: 20 },
      { size: '12', quantity: 20 }
    ]
  },
  {
    name: 'Brown Derby Dress Shoes',
    image: '/images/brown-derby-shoes.jpg',
    images: [
      '/images/brown-derby-shoes.jpg',
      '/images/brown-derby-shoes-side.jpg',
      '/images/brown-derby-shoes-detail.jpg'
    ],
    description: 'Elegant brown derby shoes with premium leather construction. Versatile for both business and casual formal wear.',
    brand: 'ProMayouf Footwear',
    category: 'Shoes',
    subCategory: 'derby',
    price: 179.99,
    countInStock: 80,
    rating: 4.4,
    numReviews: 18,
    color: 'Brown',
    material: 'Genuine Leather',
    style: 'Business',
    isOnSale: false,
    sizes: [
      { size: '8', quantity: 16 },
      { size: '9', quantity: 16 },
      { size: '10', quantity: 16 },
      { size: '11', quantity: 16 },
      { size: '12', quantity: 16 }
    ]
  },
  {
    name: 'Black Leather Loafers',
    image: '/images/black-loafers.jpg',
    images: [
      '/images/black-loafers.jpg',
      '/images/black-loafers-side.jpg',
      '/images/black-loafers-top.jpg'
    ],
    description: 'Sophisticated black leather loafers for business casual and smart casual occasions. Comfortable and stylish.',
    brand: 'ProMayouf Footwear',
    category: 'Shoes',
    subCategory: 'loafers',
    price: 159.99,
    countInStock: 60,
    rating: 4.3,
    numReviews: 12,
    color: 'Black',
    material: 'Genuine Leather',
    style: 'Business',
    isOnSale: false,
    sizes: [
      { size: '8', quantity: 12 },
      { size: '9', quantity: 12 },
      { size: '10', quantity: 12 },
      { size: '11', quantity: 12 },
      { size: '12', quantity: 12 }
    ]
  },

  // ACCESSORIES SECTION
  {
    name: 'Silk Tie - Navy Blue',
    image: '/images/navy-silk-tie.jpg',
    images: [
      '/images/navy-silk-tie.jpg',
      '/images/navy-silk-tie-detail.jpg',
      '/images/navy-silk-tie-pattern.jpg'
    ],
    description: 'Premium silk tie in navy blue with subtle pattern. Perfect complement to business suits.',
    brand: 'ProMayouf Accessories',
    category: 'Accessories',
    subCategory: 'ties',
    price: 34.99,
    regularPrice: 49.99,
    countInStock: 150,
    rating: 4.5,
    numReviews: 30,
    color: 'Navy Blue',
    material: 'Pure Silk',
    style: 'Business',
    isOnSale: true,
    salePrice: 34.99,
    saleStartDate: new Date('2024-01-01'),
    saleEndDate: new Date('2024-12-31')
  },
  {
    name: 'Leather Belt - Black',
    image: '/images/black-leather-belt.jpg',
    images: [
      '/images/black-leather-belt.jpg',
      '/images/black-leather-belt-buckle.jpg',
      '/images/black-leather-belt-detail.jpg'
    ],
    description: 'Classic black leather belt with silver buckle. Essential accessory for formal and business wear.',
    brand: 'ProMayouf Accessories',
    category: 'Accessories',
    subCategory: 'belts',
    price: 55.99,
    regularPrice: 79.99,
    countInStock: 100,
    rating: 4.4,
    numReviews: 22,
    color: 'Black',
    material: 'Genuine Leather',
    style: 'Business',
    isOnSale: true,
    salePrice: 55.99,
    saleStartDate: new Date('2024-01-01'),
    saleEndDate: new Date('2024-12-31'),
    sizes: [
      { size: '32', quantity: 20 },
      { size: '34', quantity: 20 },
      { size: '36', quantity: 20 },
      { size: '38', quantity: 20 },
      { size: '40', quantity: 20 }
    ]
  },
  {
    name: 'Pocket Square - White',
    image: '/images/white-pocket-square.jpg',
    images: [
      '/images/white-pocket-square.jpg',
      '/images/white-pocket-square-folded.jpg',
      '/images/white-pocket-square-detail.jpg'
    ],
    description: 'Classic white silk pocket square. Essential finishing touch for formal suits and tuxedos.',
    brand: 'ProMayouf Accessories',
    category: 'Accessories',
    subCategory: 'pocket-squares',
    price: 29.99,
    countInStock: 200,
    rating: 4.6,
    numReviews: 15,
    color: 'White',
    material: 'Pure Silk',
    style: 'Business',
    isOnSale: false
  },
  {
    name: 'Silver Cufflinks - Classic',
    image: '/images/silver-cufflinks.jpg',
    images: [
      '/images/silver-cufflinks.jpg',
      '/images/silver-cufflinks-detail.jpg',
      '/images/silver-cufflinks-box.jpg'
    ],
    description: 'Elegant silver cufflinks with classic design. Perfect for formal shirts and special occasions.',
    brand: 'ProMayouf Accessories',
    category: 'Accessories',
    subCategory: 'cufflinks',
    price: 89.99,
    countInStock: 75,
    rating: 4.7,
    numReviews: 20,
    color: 'Silver',
    material: 'Sterling Silver',
    style: 'Business',
    isOnSale: false
  }
];

export default products;