# Recipe Explorer: Asynchronous JavaScript Learning Project

This project helps you learn essential asynchronous JavaScript concepts through building a recipe application that connects to TheMealDB API. You'll implement various Promise patterns, work with data storage, and handle errors gracefully.

## Learning Objectives

1. Master core Promise patterns (chaining, all, race)
2. Implement proper error handling for asynchronous operations
3. Create a simple caching system for API responses
4. Understand file system operations with promises

## Prerequisites

- Node.js version 20+ (for the built-in fetch API)
- Basic understanding of JavaScript
- npm for package management

## Project Structure

```
recipe-explorer/
├── src/
│   ├── api.js             # TheMealDB API interactions
│   ├── cache.js           # Caching system for API responses
│   ├── favorites.js       # Managing favorite recipes
│   ├── app.js             # Main application logic
│   └── utils.js           # Helper functions
├── data/
│   ├── cache.json         # Cache storage
│   └── favorites.json     # Favorite recipes storage
├── test/
│   ├── api.test.js        # Tests for API functions
│   ├── cache.test.js      # Tests for caching functions
│   └── favorites.test.js  # Tests for favorites functions
├── utils/
│   └── init-data.js       # Utility to initialize data files
├── docs/
│   ├── assignment.html    # Assignment details and instructions
│   └── async-tutorial.html # Tutorial on async concepts
├── package.json
└── README.md
```

## Setup Instructions

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Initialize the data directories:

```bash
npm run init-data
```

## Running the Application

```bash
npm start
```

## Testing Your Code

As you complete each challenge, you can run the tests to verify your implementation:

```bash
npm test
```

## Challenges Overview

The project contains 24 challenges across different files. Each challenge focuses on a specific async JavaScript concept:

- **API Module (6 challenges)**: Implement functions to interact with TheMealDB API using different Promise patterns
- **Cache Module (5 challenges)**: Create a file-based caching system to store API responses
- **Favorites Module (6 challenges)**: Implement functions to manage favorite recipes with file persistence
- **App Module (7 challenges)**: Tie everything together in a command-line application

Look for `// CHALLENGE X:` comments in the code to find the challenges you need to complete.

## Resources

- Check the docs directory for detailed assignment instructions and tutorials
- Read the test files to understand expected behavior
- Use the MDN Web Docs links in the challenge comments for reference

## Evaluation Criteria

Your implementation will be evaluated based on:
1. Correct use of asynchronous patterns
2. Proper error handling
3. Effective use of caching
4. Clean, readable code
5. Passing the provided tests

## Next Steps

After completing this project, you'll build a browser-based version using the same core concepts but with DOM manipulation and localStorage instead of file system operations.

Good luck!
