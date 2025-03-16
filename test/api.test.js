// test/api.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as api from '../src/api.js';

// Mock global fetch
global.fetch = vi.fn();

describe('API Module', () => {
  // Mock response factory
  function createMockResponse(data, ok = true, status = 200) {
    return {
      ok,
      status,
      json: () => Promise.resolve(data)
    };
  }
  
  // Reset mocks before each test
  beforeEach(() => {
    fetch.mockReset();
  });
  
  describe('searchMealsByName', () => {
    it('should return meals when found', async () => {
      // Mock data
      const mockMeals = {
        meals: [
          { idMeal: '1', strMeal: 'Test Recipe' },
          { idMeal: '2', strMeal: 'Another Recipe' }
        ]
      };
      
      // Mock fetch to return meals
      fetch.mockResolvedValueOnce(createMockResponse(mockMeals));
      
      // Call the function
      const result = await api.searchMealsByName('test');
      
      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith('https://www.themealdb.com/api/json/v1/1/search.php?s=test');
      
      // Verify results
      expect(result).toEqual(mockMeals.meals);
    });
    
    it('should return empty array when no meals found', async () => {
      // Mock data with null meals
      const mockResponse = { meals: null };
      
      // Mock fetch to return null meals
      fetch.mockResolvedValueOnce(createMockResponse(mockResponse));
      
      // Call the function
      const result = await api.searchMealsByName('nonexistent');
      
      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith('https://www.themealdb.com/api/json/v1/1/search.php?s=nonexistent');
      
      // Verify empty array returned
      expect(result).toEqual([]);
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock fetch to return an error response
      fetch.mockResolvedValueOnce(createMockResponse({}, false, 500));
      
      // Call the function
      const result = await api.searchMealsByName('test');
      
      // Verify empty array returned
      expect(result).toEqual([]);
    });
    
    it('should handle network errors gracefully', async () => {
      // Mock fetch to throw an error
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Call the function
      const result = await api.searchMealsByName('test');
      
      // Verify empty array returned
      expect(result).toEqual([]);
    });
  });
  
  describe('getMealById', () => {
    it('should return a meal when found', async () => {
      // Mock data
      const mockMeal = {
        meals: [
          { idMeal: '123', strMeal: 'Test Recipe' }
        ]
      };
      
      // Mock fetch to return meal
      fetch.mockResolvedValueOnce(createMockResponse(mockMeal));
      
      // Call the function
      const result = await api.getMealById('123');
      
      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith('https://www.themealdb.com/api/json/v1/1/lookup.php?i=123');
      
      // Verify result
      expect(result).toEqual(mockMeal.meals[0]);
    });
    
    it('should return null when meal not found', async () => {
      // Mock data with null meals
      const mockResponse = { meals: null };
      
      // Mock fetch to return null meals
      fetch.mockResolvedValueOnce(createMockResponse(mockResponse));
      
      // Call the function
      const result = await api.getMealById('999');
      
      // Verify null returned
      expect(result).toBeNull();
    });
    
    it('should retry on failure', async () => {
      // First fetch fails
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Second fetch succeeds
      const mockMeal = {
        meals: [
          { idMeal: '123', strMeal: 'Test Recipe' }
        ]
      };
      fetch.mockResolvedValueOnce(createMockResponse(mockMeal));
      
      // Call the function with only 2 attempts
      const result = await api.getMealById('123', 2);
      
      // Verify fetch was called twice
      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Verify result
      expect(result).toEqual(mockMeal.meals[0]);
    });
  });
  
  describe('searchMealsByFirstLetter', () => {
    it('should combine results from multiple letters', async () => {
      // Mock data for letter 'a'
      const mockMealsA = {
        meals: [
          { idMeal: '1', strMeal: 'Apple Pie' },
          { idMeal: '2', strMeal: 'Almond Cake' }
        ]
      };
      
      // Mock data for letter 'b'
      const mockMealsB = {
        meals: [
          { idMeal: '3', strMeal: 'Banana Bread' },
          { idMeal: '4', strMeal: 'Beef Stew' }
        ]
      };
      
      // Mock fetches
      fetch.mockResolvedValueOnce(createMockResponse(mockMealsA));
      fetch.mockResolvedValueOnce(createMockResponse(mockMealsB));
      
      // Call the function
      const result = await api.searchMealsByFirstLetter(['a', 'b']);
      
      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith('https://www.themealdb.com/api/json/v1/1/search.php?f=a');
      expect(fetch).toHaveBeenCalledWith('https://www.themealdb.com/api/json/v1/1/search.php?f=b');
      
      // Verify results are combined
      expect(result.length).toBe(4);
      expect(result).toEqual([...mockMealsA.meals, ...mockMealsB.meals]);
    });
    
    it('should remove duplicate meals', async () => {
      // Mock data with a duplicate meal (same ID)
      const mockMealsA = {
        meals: [
          { idMeal: '1', strMeal: 'Apple Pie' }
        ]
      };
      
      const mockMealsB = {
        meals: [
          { idMeal: '1', strMeal: 'Apple Pie' }, // Same ID as in mockMealsA
          { idMeal: '2', strMeal: 'Banana Bread' }
        ]
      };
      
      // Mock fetches
      fetch.mockResolvedValueOnce(createMockResponse(mockMealsA));
      fetch.mockResolvedValueOnce(createMockResponse(mockMealsB));
      
      // Call the function
      const result = await api.searchMealsByFirstLetter(['a', 'b']);
      
      // Verify duplicates are removed (should have 2 results, not 3)
      expect(result.length).toBe(2);
    });
  });
  
  describe('getMealsByIngredient', () => {
    it('should return meals with the ingredient', async () => {
      // Mock data
      const mockMeals = {
        meals: [
          { idMeal: '1', strMeal: 'Chicken Curry' },
          { idMeal: '2', strMeal: 'Chicken Soup' }
        ]
      };
      
      // Mock fetch to return meals
      fetch.mockResolvedValueOnce(createMockResponse(mockMeals));
      
      // Call the function
      const result = await api.getMealsByIngredient('chicken');
      
      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith('https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken');
      
      // Verify results
      expect(result).toEqual(mockMeals.meals);
    });
    
    it('should handle timeout gracefully', async () => {
      // This test is complex because we need to mock Promise.race behavior
      // For simplicity, we'll just mock fetch to delay longer than the timeout
      
      // Mock a delayed fetch that takes longer than the timeout
      fetch.mockImplementationOnce(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(createMockResponse({ meals: [] }));
          }, 100); // Longer than our test timeout
        });
      });
      
      // Call the function with a very short timeout
      const result = await api.getMealsByIngredient('chicken', 10); // 10ms timeout
      
      // Result should be the error message string
      expect(typeof result).toBe('string');
      expect(result).toContain('took too long');
    });
  });
});
