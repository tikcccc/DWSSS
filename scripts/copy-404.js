import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define source and destination paths
const sourceFile = path.join(__dirname, '../public/404.html');
const destFile = path.join(__dirname, '../dist/404.html');

// Copy the file
try {
  // Create the destination directory if it doesn't exist
  const destDir = path.dirname(destFile);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Read the source file
  const data = fs.readFileSync(sourceFile);
  
  // Write to the destination file
  fs.writeFileSync(destFile, data);
  
  console.log(`Successfully copied 404.html to dist folder`);

  // Also copy .nojekyll file
  const sourceNojekyll = path.join(__dirname, '../public/.nojekyll');
  const destNojekyll = path.join(__dirname, '../dist/.nojekyll');
  
  if (fs.existsSync(sourceNojekyll)) {
    fs.writeFileSync(destNojekyll, '');
    console.log(`Successfully copied .nojekyll to dist folder`);
  }
} catch (err) {
  console.error(`Error copying file: ${err.message}`);
  process.exit(1);
} 