// src/favorites.js
/**
 * This module provides functionality to manage favorite recipes
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAVORITES_FILE = path.join(__dirname, '../data/favorites.json');

/**
 * Initialize favorites file if it doesn't exist
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function | MDN: async function}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | MDN: try...catch}
 * @see {@link https://nodejs.org/api/fs.html#fs_promises_api | Node.js: fs/promises}
 */
export async function initializeFavorites() {
  // CHALLENGE 12: Implement initializeFavorites function
  // 1. Try to access the FAVORITES_FILE using fs.access
  // 2. If the file doesn't exist (access throws an error), create it:
  //    - Make sure the directory exists (get the directory using path.dirname)
  //    - Create the directory if needed using fs.mkdir with { recursive: true }
  //    - Write an empty array as JSON to the file using fs.writeFile
  // 3. Handle any errors appropriately

  try {
    await fs.access(FAVORITES_FILE);
  }
  catch (error) {

    console.error('File does not exist: ' + error);
    const dirPath = path.dirname(FAVORITES_FILE);

    try {
      await fs.access(dirPath);
    } catch (error2) {
      console.error('Directory does not exist: ' + error2);
      console.log('Creating directory');
      fs.mkdir(dirPath, { recursive: true });
    }

    try {
      fs.writeFile(FAVORITES_FILE, "[]");
    }
    catch (e) {
      console.error('Error creating file.');
    }
  }
}

/**
 * Get all favorite recipes
 *
 * @returns {Promise<Array>} - Array of favorite recipes
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | MDN: JSON.parse}
 */
export async function getFavorites() {
  // CHALLENGE 13: Implement getFavorites function
  // 1. Make sure favorites file exists by calling initializeFavorites
  // 2. Read the favorites file using fs.readFile
  // 3. Parse the JSON data and return it
  // 4. Handle any errors and return an empty array if something goes wrong

  try {

    initializeFavorites();

    const content = await fs.readFile(FAVORITES_FILE);
    if (content.length === 0) {
      return [];
    }

    const favoritesData = await JSON.parse(content);
    return favoritesData;

  } catch (error) {
    console.error('Error reading favorites file:', error);
    return [];
  }

}

/**
 * Add a recipe to favorites
 *
 * @param {Object} recipe - Recipe to add
 * @returns {Promise<boolean>} - True if added successfully
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some | MDN: Array.some}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push | MDN: Array.push}
 */
export async function addFavorite(recipe) {
  // CHALLENGE 14: Implement addFavorite function
  // 1. Make sure favorites file exists by calling initializeFavorites
  // 2. Get current favorites by calling getFavorites
  // 3. Check if recipe already exists in favorites by checking its idMeal property
  // 4. If it already exists, return false
  // 5. If it doesn't exist, add it to favorites array
  // 6. Save updated favorites back to the file using fs.writeFile
  // 7. Return true on success
  // 8. Handle any errors and return false on failure

  try {

    await initializeFavorites();

    const favorites = await getFavorites();

    const exists = favorites.some((fav) => { return fav.idMeal === recipe.idMeal });
    if (exists) {
      console.log(`Recipe ${recipe.strMeal} is already in favorites.`);
      return false;
    }

    favorites.push(recipe);

    await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2));

    console.log(`Added ${recipe.strMeal} to favorites`);

    return true;

  } catch (error) {
    console.error('Error adding favorite:', error.message);
    return false;
  }
}

/**
 * Remove a recipe from favorites
 *
 * @param {string} recipeId - ID of recipe to remove
 * @returns {Promise<boolean>} - True if removed successfully
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter | MDN: Array.filter}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify | MDN: JSON.stringify}
 */
export async function removeFavorite(recipeId) {
  // CHALLENGE 15: Implement removeFavorite function
  // 1. Make sure favorites file exists by calling initializeFavorites
  // 2. Get current favorites by calling getFavorites
  // 3. Store the initial length of favorites array
  // 4. Filter out the recipe with the matching ID
  // 5. If the array length didn't change, return false (recipe wasn't found)
  // 6. Save updated favorites back to the file
  // 7. Return true on success
  // 8. Handle any errors and return false on failure

  try {

    await initializeFavorites();

    const favorites = await getFavorites();
    let initialLength = favorites.length;
    // Filter out the recipe with the matching ID
    const filteredFavorites = favorites.filter(favorite => favorite.idMeal !== recipeId);
    // If the array length didn't change, return false (recipe wasn't found)
    if (filteredFavorites.length === initialLength) {
      // Recipe wasn't found in favorites
      return false;
    }


    await fs.writeFile(FAVORITES_FILE, JSON.stringify(filteredFavorites, null, 2));

    return true;

  } catch (error) {
    console.error('Error adding favorite:', error);
    return false;
  }
}

/**
 * Check if a recipe is in favorites
 *
 * @param {string} recipeId - Recipe ID to check
 * @returns {Promise<boolean>} - True if recipe is in favorites
 */
export async function isInFavorites(recipeId) {
  // CHALLENGE 16: Implement isInFavorites function
  // 1. Get the favorites array by calling getFavorites
  // 2. Use Array.some to check if any recipe has a matching idMeal
  // 3. Return the result (true if found, false if not)
  // 4. Handle any errors and return false on failure

  try {

    const favorites = await getFavorites();

    return favorites.some(recipe => recipe.idMeal === recipeId);

    /* const exists = favorites.some(favorite => favorite.recipe.idMeal === recipeId);
    if (exists) {
      return true;
    }

     return false;
*/

  } catch (error) {
    console.error("Error in isInFavorites: " + error);
    return false;
  }
}

/**
 * Get a specific favorite recipe by ID
 *
 * @param {string} recipeId - Recipe ID to get
 * @returns {Promise<Object|null>} - Recipe object or null if not found
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find | MDN: Array.find}
 */
export async function getFavoriteById(recipeId) {
  // CHALLENGE 17: Implement getFavoriteById function
  // 1. Get the favorites array by calling getFavorites
  // 2. Use Array.find to find the recipe with the matching idMeal
  // 3. Return the found recipe or null if not found
  // 4. Handle any errors and return null on failure

  try {

    const favorites = await getFavorites();

    return favorites.find(recipe => recipe.idMeal === recipeId) || null;

    /* const recipe = favorites.find(favorite => favorite.recipe.idMeal === recipeId);
    if (recipe) {
      return recipe;
    } else {
      return null;
    }
*/
  } catch (error) {
    console.error("Error in getFavoriteById: ", error.message);
    return null;
  }
}

export default {
  initializeFavorites,
  getFavorites,
  addFavorite,
  removeFavorite,
  isInFavorites,
  getFavoriteById
};
