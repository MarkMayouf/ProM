import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS = {
  'visa.png': 'https://cdn.jsdelivr.net/gh/ionic-team/ionicons@5.5.1/src/svg/card-outline.svg',
  'mastercard.png': 'https://cdn.jsdelivr.net/gh/ionic-team/ionicons@5.5.1/src/svg/card-outline.svg',
  'discover.png': 'https://cdn.jsdelivr.net/gh/ionic-team/ionicons@5.5.1/src/svg/card-outline.svg',
  'paypal.png': 'https://cdn.jsdelivr.net/gh/ionic-team/ionicons@5.5.1/src/svg/logo-paypal.svg'
};

const ICONS_DIR = path.join(__dirname, '..', 'frontend', 'public', 'images', 'payment-icons');

// Create directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Download each icon
Object.entries(ICONS).forEach(([filename, url]) => {
  const filepath = path.join(ICONS_DIR, filename);
  
  https.get(url, (response) => {
    const fileStream = fs.createWriteStream(filepath);
    response.pipe(fileStream);
    
    fileStream.on('finish', () => {
      console.log(`Downloaded ${filename}`);
      fileStream.close();
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${filename}:`, err.message);
    // Remove partial file if download failed
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  });
}); 