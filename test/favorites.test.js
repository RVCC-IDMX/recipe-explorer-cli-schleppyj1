// test/favorites.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

// Important: vi.mock() calls get hoisted to the top of the file
// We need to define our mocks in a way that works with hoisting
vi.mock('fs/promises', () => {
  return {
    // This function format works with hoisting
    access: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    // Include a default export that references the same functions
    default: {
      access: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn()
    }
  };
});

// Import modules after mocking
import * as favorites from '../src/favorites.js';
import fs from 'fs/promises';

// Spy on console.log and console.error for additional test checks
vi.spyOn(console, 'log').mockImplementation(() => { });
vi.spyOn(console, 'error').mockImplementation(() => { });

// Mock path to favorites file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FAVORITES_FILE = path.join(__dirname, '../data/favorites.json');

describe('Favorites Module', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('initializeFavorites', () => {
    it('should create favorites file if it does not exist', async () => {
      // Simulate the file not existing
      fs.access.mockRejectedValueOnce(new Error('File not found'));
      // Simulate the directory also not existing so that mkdir is called
      fs.access.mockRejectedValueOnce(new Error('Directory not found'));

      // Call the function
      await favorites.initializeFavorites();

      // Verify that mkdir was called to create the directory
      expect(fs.mkdir).toHaveBeenCalled();

      // Verify that writeFile was called with an empty favorites array
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('favorites.json'),
        JSON.stringify([], null, 2)
      );
    });

    it('should not create favorites file if it already exists', async () => {
      // Mock fs.access to resolve (file exists)
      fs.access.mockResolvedValueOnce(undefined);

      // Call the function
      await favorites.initializeFavorites();

      // Verify writeFile was not called
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('getFavorites', () => {
    it('should return favorites from file', async () => {
      // Mock favorites data
      const mockFavorites = [
        { idMeal: '1', strMeal: 'Favorite 1' },
        { idMeal: '2', strMeal: 'Favorite 2' }
      ];

      // First mock access to succeed (file exists)
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock readFile to return mock data
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockFavorites));

      // Call the function
      const result = await favorites.getFavorites();

      // Verify result matches mock data
      expect(result).toEqual(mockFavorites);
    });

    it('should handle file system errors gracefully', async () => {
      // First mock access to succeed (file exists)
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock readFile to throw an error
      fs.readFile.mockRejectedValueOnce(new Error('File system error'));

      // Call the function
      const result = await favorites.getFavorites();

      // Verify result is empty array (error occurred)
      expect(result).toEqual([]);
    });
  });

  describe('addFavorite', () => {
    it('should add a recipe to favorites', async () => {
      // Mock existing favorites
      const mockExistingFavorites = [
        { idMeal: '1', strMeal: 'Existing Favorite' }
      ];

      // First mock access for initializeFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock access for getFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock readFile to return existing favorites
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockExistingFavorites));

      // New recipe to add
      const newRecipe = { idMeal: '2', strMeal: 'New Favorite' };

      // Call the function
      const result = await favorites.addFavorite(newRecipe);

      // Verify result is true (add successful)
      expect(result).toBe(true);

      // Verify writeFile was called with combined favorites
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('favorites.json'),
        JSON.stringify([...mockExistingFavorites, newRecipe], null, 2)
      );
    });

    it('should not add duplicate recipe', async () => {
      // Mock existing favorites including the recipe we'll try to add
      const existingRecipe = { idMeal: '1', strMeal: 'Existing Favorite' };
      const mockExistingFavorites = [existingRecipe];

      // First mock access for initializeFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock access for getFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock readFile to return existing favorites
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockExistingFavorites));

      // Call the function with the same recipe
      const result = await favorites.addFavorite(existingRecipe);

      // Verify result is false (add skipped)
      expect(result).toBe(false);

      // Verify writeFile was not called
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file system errors gracefully', async () => {
      // For initializeFavorites, simulate file exists so no creation is needed
      fs.access.mockResolvedValueOnce(undefined);
      // For getFavorites, simulate a successful access and read (returning an empty array)
      fs.access.mockResolvedValueOnce(undefined);
      fs.readFile.mockResolvedValueOnce(JSON.stringify([]));

      // Simulate an error when writing the updated favorites file
      fs.writeFile.mockRejectedValueOnce(new Error('Write error'));

      // Spy on writeFile to check that it was indeed attempted
      const writeFileSpy = vi.spyOn(fs, 'writeFile');

      const result = await favorites.addFavorite({ idMeal: '1', strMeal: 'Test Recipe' });

      // Verify result is false (add failed)
      expect(result).toBe(false);

      // Verify writeFile was called
      expect(writeFileSpy).toHaveBeenCalled();

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error adding favorite:'),
        expect.any(String)
      );
    });
  });

  describe('removeFavorite', () => {
    it('should remove a recipe from favorites', async () => {
      // Mock existing favorites
      const mockExistingFavorites = [
        { idMeal: '1', strMeal: 'Favorite 1' },
        { idMeal: '2', strMeal: 'Favorite 2' }
      ];

      // First mock access for initializeFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock access for getFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock readFile to return existing favorites
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockExistingFavorites));

      // Call the function to remove recipe with ID '1'
      const result = await favorites.removeFavorite('1');

      // Verify result is true (remove successful)
      expect(result).toBe(true);

      // Verify writeFile was called with updated favorites (only recipe with ID '2')
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('favorites.json'),
        JSON.stringify([{ idMeal: '2', strMeal: 'Favorite 2' }], null, 2)
      );
    });

    it('should return false if recipe not found', async () => {
      // Mock existing favorites
      const mockExistingFavorites = [
        { idMeal: '1', strMeal: 'Favorite 1' }
      ];

      // First mock access for initializeFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock access for getFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Then mock readFile to return existing favorites
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockExistingFavorites));

      // Call the function to remove recipe with ID '999' (not in favorites)
      const result = await favorites.removeFavorite('999');

      // Verify result is false (recipe not found)
      expect(result).toBe(false);

      // Verify writeFile was not called
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file system errors gracefully', async () => {
      // Mock readFile to throw an error
      fs.access.mockResolvedValueOnce(undefined); // For initializeFavorites
      fs.readFile.mockRejectedValueOnce(new Error('File system error')); // For getFavorites

      // Call the function
      const result = await favorites.removeFavorite('1');

      // Verify result is false (remove failed)
      expect(result).toBe(false);
    });
  });

  describe('isInFavorites', () => {
    it('should return true if recipe is in favorites', async () => {
      // Mock existing favorites
      const mockExistingFavorites = [
        { idMeal: '1', strMeal: 'Favorite 1' },
        { idMeal: '2', strMeal: 'Favorite 2' }
      ];

      // Mock for initializeFavorites in getFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Mock readFile to return existing favorites
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockExistingFavorites));

      // Call the function to check recipe with ID '1'
      const result = await favorites.isInFavorites('1');

      // Verify result is true (recipe is in favorites)
      expect(result).toBe(true);
    });

    it('should return false if recipe is not in favorites', async () => {
      // Mock existing favorites
      const mockExistingFavorites = [
        { idMeal: '1', strMeal: 'Favorite 1' }
      ];

      // Mock for initializeFavorites in getFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Mock readFile to return existing favorites
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockExistingFavorites));

      // Call the function to check recipe with ID '999' (not in favorites)
      const result = await favorites.isInFavorites('999');

      // Verify result is false (recipe not in favorites)
      expect(result).toBe(false);
    });

    it('should handle file system errors gracefully', async () => {
      // Mock readFile to throw an error
      fs.access.mockResolvedValueOnce(undefined); // For initializeFavorites
      fs.readFile.mockRejectedValueOnce(new Error('File system error')); // For getFavorites

      // Call the function
      const result = await favorites.isInFavorites('1');

      // Verify result is false (error occurred)
      expect(result).toBe(false);
    });
  });

  describe('getFavoriteById', () => {
    it('should return a favorite recipe by ID', async () => {
      // Mock existing favorites
      const mockExistingFavorites = [
        { idMeal: '1', strMeal: 'Favorite 1' },
        { idMeal: '2', strMeal: 'Favorite 2' }
      ];

      // Mock for initializeFavorites in getFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Mock readFile to return existing favorites
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockExistingFavorites));

      // Call the function to get recipe with ID '1'
      const result = await favorites.getFavoriteById('1');

      // Verify result is the correct recipe
      expect(result).toEqual({ idMeal: '1', strMeal: 'Favorite 1' });
    });

    it('should return null if recipe is not found', async () => {
      // Mock existing favorites
      const mockExistingFavorites = [
        { idMeal: '1', strMeal: 'Favorite 1' }
      ];

      // Mock for initializeFavorites in getFavorites
      fs.access.mockResolvedValueOnce(undefined);

      // Mock readFile to return existing favorites
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockExistingFavorites));

      // Call the function to get recipe with ID '999' (not in favorites)
      const result = await favorites.getFavoriteById('999');

      // Verify result is null (recipe not found)
      expect(result).toBeNull();
    });

    it('should handle file system errors gracefully', async () => {
      // Mock readFile to throw an error
      fs.access.mockResolvedValueOnce(undefined); // For initializeFavorites
      fs.readFile.mockRejectedValueOnce(new Error('File system error')); // For getFavorites

      // Call the function
      const result = await favorites.getFavoriteById('1');

      // Verify result is null (error occurred)
      expect(result).toBeNull();
    });
  });
});
