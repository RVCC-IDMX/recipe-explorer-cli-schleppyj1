// src/api.js
/**
 * This module contains functions for interacting with TheMealDB API
 * All functions use the built-in fetch API available in Node.js 20+
 */

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

/**
 * Search for meals by name
 * @param {string} query - Search term
 * @returns {Promise<Array>} - Array of meal objects
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch | MDN: fetch API}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | MDN: Promise}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | MDN: try...catch}
 */
export async function searchMealsByName(query) {
  // CHALLENGE 1: Implement the searchMealsByName function
  // 1. Use the fetch API to make a request to `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`
  // 2. Check if the response is ok (response.ok)
  // 3. If not ok, throw an error with the status code
  // 4. Parse the JSON response (response.json())
  // 5. Return data.meals or an empty array if meals is null
  // 6. Wrap everything in a try/catch block and return empty array on error

  try {
    console.log("Commencing searchMealsByName");

    const response = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    console.log("json = " + json);
    if (json.meals != null) {
      return json.meals;
    }
    else {
      return [];
    }
  } catch (error) {
    console.error(error.message);
    return [];
  }
}

/**
 * Get detailed information about a specific meal by ID
 * Implementation includes retry logic for resilience
 *
 * @param {string} id - Meal ID
 * @param {number} attempts - Number of retry attempts (default: 2)
 * @returns {Promise<Object|null>} - Meal details or null if not found
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function | MDN: async function}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await | MDN: await}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling | MDN: Error handling}
 */
export async function getMealById(id, attempts = 2) {
  // CHALLENGE 2: Implement the getMealById function with retry logic
  // 1. Use fetch to get meal details from `${BASE_URL}/lookup.php?i=${id}`
  // 2. Check if response is ok
  // 3. Parse JSON and return the first meal (data.meals[0]) or null if no meals
  // 4. Add retry logic: if fetch fails and attempts > 1, wait 1 second and retry
  //    (use "await new Promise(resolve => setTimeout(resolve, 1000))" to wait)
  // 5. Decrement attempts and call the function recursively
  // 6. Handle errors with try/catch

  try {
    const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    if (!response.ok) {
      if (attempts >= 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts--;
        return getMealById(id, attempts);
      }

      else {
        throw new Error(`Response status: ${response.status}`);
      }

    }

    else {
      const json = await response.json();
      if (json.meals != null) {
        return json.meals[0];
      }

      else {
        return null;
      }
    }

  }

  catch {
    if (attempts >= 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts--;
      return getMealById(id, attempts);
    }

    else {
      //  throw new Error("Get meal by id error.");
      return getMealById(id, attempts);
    }

  }
}

/**
 * Search for meals starting with specific letters
 * Uses Promise.all to fetch results for multiple letters in parallel
 *
 * @param {Array<string>} letters - Array of letters to search by
 * @returns {Promise<Array>} - Combined array of meals starting with any of the letters
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all | MDN: Promise.all}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map | MDN: Array.map}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set | MDN: Set}
 */
export async function searchMealsByFirstLetter(letters) {
  // CHALLENGE 3: Implement searchMealsByFirstLetter using Promise.all
  // 1. Create an array of promises by mapping over the letters array
  // 2. For each letter, create a fetch promise that:
  //    - Fetches from `${BASE_URL}/search.php?f=${letter.charAt(0)}`
  //    - Handles the response (checks if ok, parses JSON)
  //    - Returns meals array or empty array
  //    - Catches errors and returns empty array
  // 3. Use Promise.all to wait for all promises to resolve
  // 4. Combine results and remove duplicates (using meal IDs and Set)
  // 5. Return the combined array of meals
  // 6. Wrap in a try/catch block
  try {
    console.log("Commencing searchMealsByFirstLetter");
    const promises = letters.map(async (letter) => {
      const response = await fetch(`${BASE_URL}/search.php?f=${letter.charAt(0)}`);
      if (response.ok) {
        console.log("Response ok: " + response.status);
        return response.json();
      }

      else {
        console.log("Error retreiving data: " + response.status);
        return [];
      }

    });


    const results = await Promise.all(promises);

    let fullMealsArray = [];

    results.forEach(json => {

      if (json.meals != null) {
        json.meals.forEach(meal => {
          fullMealsArray.push(meal);
        });
      }

    });

    console.log("fullMealsArray length: " + fullMealsArray.length);

    const mealIdsSet = new Set();
    const uniqueMeals = fullMealsArray.filter(meal => {
      if (mealIdsSet.has(meal.idMeal)) {
        return false;
      } else {
        mealIdsSet.add(meal.idMeal);
        return true;
      }
    });

    console.log("uniqueMeals length: " + uniqueMeals.length);
    return uniqueMeals;


  } catch (e) {
    console.error("searchMealsByFirstLetter error: " + e);
    return []
  }

}

/**
 * Search for meals containing a specific ingredient
 * Implements a timeout using Promise.race
 *
 * @param {string} ingredient - Ingredient to search for
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Array|string>} - Array of meals or error message if timeout
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race | MDN: Promise.race}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises | MDN: Using promises}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof | MDN: typeof}
 */
export async function getMealsByIngredient(ingredient, timeoutMs = 5000) {
  // CHALLENGE 4: Implement getMealsByIngredient with timeout using Promise.race
  // 1. Create a timeout promise that rejects after timeoutMs milliseconds
  // 2. Create a fetch promise that gets meals by ingredient
  //    - Fetch from `${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`
  //    - Handle the response (check if ok, parse JSON)
  //    - Return meals array or empty array
  // 3. Use Promise.race to race the fetch against the timeout
  // 4. Return the result (either meals array or error message)
  // 5. Handle errors and return a user-friendly message if timeout occurs

  try {
    const timeoutPromise = new Promise((_, reject) => {
      // Reject after timeoutMs milliseconds
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, timeoutMs);
    });

    const fetchPromise = fetch(`${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    }).then(data => {
      // Check if meals exist in the response
      if (data.meals) {
        return data.meals; // Return the meals array
      } else {
        return []; // Return empty array if no meals found
      }
    });

    const result = await Promise.race([fetchPromise, timeoutPromise]);


    return result;
  } catch (error) {
    console.error('Error fetching meals by ingredient:', error.message);
    if (error.message.includes("Request timed out")) {
      return `The request for meals with "${ingredient}" took too long. Please try again later.`;
    }
    return [];
  }
}

/**
 * Get related recipes based on a recipe's category
 * Used in promise chaining examples
 *
 * @param {Object} recipe - Recipe object with strCategory property
 * @param {number} limit - Maximum number of related recipes to return
 * @returns {Promise<Array>} - Array of related recipes
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter | MDN: Array.filter}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice | MDN: Array.slice}
 */
export async function getRelatedRecipes(recipe, limit = 3) {
  // CHALLENGE 5: Implement getRelatedRecipes function
  // 1. Check if recipe is valid and has a category (strCategory)
  // 2. Fetch recipes by category: `${BASE_URL}/filter.php?c=${encodeURIComponent(recipe.strCategory)}`
  // 3. Handle the response (check if ok, parse JSON)
  // 4. Remove the original recipe from results using filter
  // 5. Limit the number of results using slice
  // 6. Return the filtered & limited array
  // 7. Handle errors with try/catch

  try {

    if (recipe != null && recipe.strCategory != null && recipe.strCategory != 'undefined') {
      return [];
    }

    const response = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(recipe.strCategory)}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const meals = data.meals || [];

    const filtered = meals.filter((meal) => meal.idMeal !== recipe.idMeal);

    return filtered.slice(0, limit);
  }

  catch (error) {
    error;
    console.error('Error fetching related recipes: ', error);
    return [];
  }


}

/**
 * Get a random meal from the API
 *
 * @returns {Promise<Object|null>} - Random meal or null if error
 */
export async function getRandomMeal() {
  // CHALLENGE 6: Implement getRandomMeal function
  // 1. Fetch a random meal from `${BASE_URL}/random.php`
  // 2. Handle the response (check if ok, parse JSON)
  // 3. Return the first meal or null if no meals
  // 4. Handle errors with try/catch

  try {
    console.log("Commencing getRandomMeal");

    const response = await fetch(`${BASE_URL}/random.php`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.meals != null) {
      console.log("meal = " + JSON.stringify(json.meals[0]));
      return json.meals[0];
    }
    else {
      return [];
    }
  } catch (error) {
    console.error(error.message);
    return [];
  }
}

export default {
  searchMealsByName,
  getMealById,
  searchMealsByFirstLetter,
  getMealsByIngredient,
  getRelatedRecipes,
  getRandomMeal
};
