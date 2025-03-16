// test/cache.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock fs/promises with both named exports and a default export.
vi.mock('fs/promises', () => {
  const access = vi.fn();
  const readFile = vi.fn();
  const writeFile = vi.fn();
  const mkdir = vi.fn();
  return {
    __esModule: true,
    default: { access, readFile, writeFile, mkdir },
    access,
    readFile,
    writeFile,
    mkdir,
  };
});

import * as cache from '../src/cache.js';
import * as fs from 'fs/promises';

// Get the cache file path (for reference)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '../data/cache.json');

describe('Cache Module', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  describe('initializeCache', () => {
    it('should create cache file if it does not exist', async () => {
      // Simulate the cache file does not exist...
      fs.access.mockRejectedValueOnce(new Error('File not found'));
      // ...and the directory does not exist (so mkdir is needed)
      fs.access.mockRejectedValueOnce(new Error('Directory not found'));

      await cache.initializeCache();

      // Expect that the directory was created and the file written with an empty object.
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('cache.json'),
        JSON.stringify({}, null, 2)
      );
    });

    it('should not create cache file if it already exists', async () => {
      // Simulate the cache file exists.
      fs.access.mockResolvedValueOnce(undefined);
      await cache.initializeCache();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('getFromCache', () => {
    it('should return data if it exists and is not expired', async () => {
      // Fix the current time so the stored timestamp is valid.
      const fixedTime = Date.now();
      vi.useFakeTimers().setSystemTime(fixedTime);
      const mockCache = {
        test_key: {
          timestamp: fixedTime, // current time, so not expired
          data: { id: 1, name: 'Test Data' }
        }
      };
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCache));
      const result = await cache.getFromCache('test_key');
      expect(result).toEqual({ id: 1, name: 'Test Data' });
      vi.useRealTimers();
    });

    it('should return null if data is expired', async () => {
      const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const mockCache = {
        test_key: {
          timestamp: expiredTimestamp,
          data: { id: 1, name: 'Test Data' }
        }
      };
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCache));
      const result = await cache.getFromCache('test_key');
      expect(result).toBeNull();
    });

    it('should return null if key does not exist', async () => {
      const mockCache = {
        other_key: {
          timestamp: Date.now(),
          data: { id: 1, name: 'Test Data' }
        }
      };
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCache));
      const result = await cache.getFromCache('test_key');
      expect(result).toBeNull();
    });

    it('should handle file system errors gracefully', async () => {
      fs.readFile.mockRejectedValueOnce(new Error('File system error'));
      const result = await cache.getFromCache('test_key');
      expect(result).toBeNull();
    });
  });

  describe('saveToCache', () => {
    it('should save data to cache file', async () => {
      // Simulate that the cache file exists.
      fs.access.mockResolvedValueOnce(undefined);
      const existingCache = {
        existing_key: {
          timestamp: Date.now(),
          data: { id: 2, name: 'Existing Data' }
        }
      };
      fs.readFile.mockResolvedValueOnce(JSON.stringify(existingCache));
      const newData = { id: 1, name: 'Test Data' };
      const result = await cache.saveToCache('test_key', newData);
      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('cache.json'),
        expect.stringContaining('test_key')
      );
    });

    it('should handle file system errors gracefully', async () => {
      fs.access.mockResolvedValueOnce(undefined);
      fs.readFile.mockRejectedValueOnce(new Error('File system error'));
      const result = await cache.saveToCache('test_key', { id: 1 });
      expect(result).toBe(false);
    });
  });

  describe('getCachedOrFetch', () => {
    it('should return cached data if available', async () => {
      const cachedData = { id: 1, name: 'Cached Data' };
      // Simulate a cache hit by returning a cache object that is not expired.
      const cacheObj = {
        test_key: {
          timestamp: Date.now(),
          data: cachedData
        }
      };
      fs.readFile.mockResolvedValueOnce(JSON.stringify(cacheObj));
      const fetchFn = vi.fn();
      const result = await cache.getCachedOrFetch('test_key', fetchFn);
      // Since valid cache data exists, fetchFn should not be called.
      expect(fetchFn).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should fetch fresh data if cache miss', async () => {
      // Simulate a cache miss by having an empty cache.
      fs.readFile.mockResolvedValueOnce(JSON.stringify({}));
      const freshData = { id: 1, name: 'Fresh Data' };
      const fetchFn = vi.fn().mockResolvedValue(freshData);
      // Simulate successful write when saving fresh data.
      fs.writeFile.mockResolvedValueOnce();
      const result = await cache.getCachedOrFetch('test_key', fetchFn);
      expect(fetchFn).toHaveBeenCalled();
      expect(result).toEqual(freshData);
    });

    it('should force refresh if requested', async () => {
      const freshData = { id: 1, name: 'Fresh Data' };
      const fetchFn = vi.fn().mockResolvedValue(freshData);
      fs.writeFile.mockResolvedValueOnce();
      const result = await cache.getCachedOrFetch('test_key', fetchFn, true);
      // With forceRefresh true, cache is bypassed.
      expect(fetchFn).toHaveBeenCalled();
      expect(result).toEqual(freshData);
    });

    it('should use expired cache as fallback if fetch fails', async () => {
      // Simulate a cache miss (or expired) on the first call.
      fs.readFile.mockResolvedValueOnce(JSON.stringify({}));
      // Create a fetch function that fails.
      const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));
      // For fallback, simulate expired cache data on a second call.
      const expiredCache = {
        test_key: {
          timestamp: Date.now() - 25 * 60 * 60 * 1000,
          data: { id: 1, name: 'Expired Data' }
        }
      };
      fs.readFile.mockResolvedValueOnce(JSON.stringify(expiredCache));
      const result = await cache.getCachedOrFetch('test_key', fetchFn);
      expect(result).toEqual(expiredCache.test_key.data);
    });
  });
});
