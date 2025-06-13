import { bulkUpload } from './bulk-image-upload.js';
import fs from 'fs';
import path from 'path';

// Demo function to create sample images directory structure
function createSampleStructure() {
  const sampleDir = './sample-images';
  
  // Create directories if they don't exist
  const dirs = [
    sampleDir,
    `${sampleDir}/suits`,
    `${sampleDir}/shoes`,
    `${sampleDir}/accessories`
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
  
  console.log(`
📋 Sample Directory Structure Created:
${sampleDir}/
├── suits/          (Place suit images here)
├── shoes/          (Place shoe images here)
└── accessories/    (Place accessory images here)

📝 Instructions:
1. Add your product images to the appropriate folders
2. Run: node demo-upload.js
3. Images will be uploaded to your server

💡 Tip: Use descriptive filenames like:
   - navy-business-suit-front.jpg
   - oxford-shoes-black-side.jpg
   - silk-tie-red-pattern.jpg
  `);
}

// Main demo function
async function runDemo() {
  console.log('🎬 Portfolio Image Upload Demo');
  console.log('================================\n');
  
  const sampleDir = './sample-images';
  
  // Check if sample directory exists
  if (!fs.existsSync(sampleDir)) {
    console.log('📁 Creating sample directory structure...\n');
    createSampleStructure();
    console.log('\n⚠️  Please add your images to the sample-images folder and run the script again.');
    return;
  }
  
  // Check if there are any images
  const hasImages = fs.readdirSync(sampleDir, { withFileTypes: true })
    .some(dirent => {
      if (dirent.isDirectory()) {
        const subDir = path.join(sampleDir, dirent.name);
        const files = fs.readdirSync(subDir);
        return files.some(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });
      }
      return false;
    });
  
  if (!hasImages) {
    console.log('📸 No images found in sample directories.');
    console.log('   Please add some images and try again.\n');
    createSampleStructure();
    return;
  }
  
  console.log('🚀 Starting bulk upload demo...\n');
  
  // Upload images from each category
  const categories = ['suits', 'shoes', 'accessories'];
  
  for (const category of categories) {
    const categoryDir = path.join(sampleDir, category);
    
    if (fs.existsSync(categoryDir)) {
      const files = fs.readdirSync(categoryDir);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      });
      
      if (imageFiles.length > 0) {
        console.log(`\n📂 Processing ${category} category (${imageFiles.length} images)...`);
        await bulkUpload(categoryDir);
      }
    }
  }
  
  console.log('\n🎉 Demo completed! Check your admin panel to see the uploaded images.');
}

// Run the demo
runDemo().catch(error => {
  console.error('❌ Demo failed:', error.message);
  process.exit(1);
}); 