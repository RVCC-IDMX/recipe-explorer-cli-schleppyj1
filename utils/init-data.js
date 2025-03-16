// utils/init-data.js
/**
 * Utility script to initialize the data directories and files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data directories and files
const dataDir = path.join(__dirname, '../data');
const cacheFile = path.join(dataDir, 'cache.json');
const favoritesFile = path.join(dataDir, 'favorites.json');

/**
 * Initialize the data directories and files
 */
async function initData() {
  try {
    console.log('Initializing data directories and files...');
    
    // Create data directory if it doesn't exist
    try {
      await fs.access(dataDir);
      console.log('Data directory already exists');
    } catch (error) {
      console.log('Creating data directory...');
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    // Create cache file if it doesn't exist
    try {
      await fs.access(cacheFile);
      console.log('Cache file already exists');
    } catch (error) {
      console.log('Creating cache file...');
      await fs.writeFile(cacheFile, JSON.stringify({}, null, 2));
    }
    
    // Create favorites file if it doesn't exist
    try {
      await fs.access(favoritesFile);
      console.log('Favorites file already exists');
    } catch (error) {
      console.log('Creating favorites file...');
      await fs.writeFile(favoritesFile, JSON.stringify([], null, 2));
    }
    
    console.log('Data initialization complete!');
  } catch (error) {
    console.error('Error initializing data:', error.message);
    process.exit(1);
  }
}

// Run the initialization
initData();
