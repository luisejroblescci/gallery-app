/**
 * @jest-environment jsdom
 */

describe('Flaky Randomness-Based Tests', () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="game-container">
        <div id="score-display">0</div>
        <button id="random-action">Random Action</button>
        <div class="shuffle-list">
          <div class="item" data-id="1">Item 1</div>
          <div class="item" data-id="2">Item 2</div>
          <div class="item" data-id="3">Item 3</div>
        </div>
      </div>
    `;
    document.body.innerHTML = mockHTML;
  });

  // FIXED TEST 11: Math.random() dependent logic (deterministic)
  test('should generate expected random values (FLAKY: Math.random)', () => {
    const scoreDisplay = document.getElementById('score-display');
    const originalRandom = Math.random;
    
    // Mock Math.random with predetermined values for consistent test results
    const mockRandomValues = [0.8, 0.2, 0.42];
    let callIndex = 0;
    
    Math.random = jest.fn(() => {
      const value = mockRandomValues[callIndex % mockRandomValues.length];
      callIndex++;
      return value;
    });
    
    // Mock random score generation
    const mockGenerateScore = () => {
      const randomMultiplier = Math.random(); // 0-1
      const baseScore = 100;
      return Math.floor(baseScore * randomMultiplier);
    };

    const score1 = mockGenerateScore(); // 80 (0.8 * 100)
    const score2 = mockGenerateScore(); // 20 (0.2 * 100) 
    const score3 = mockGenerateScore(); // 42 (0.42 * 100)
    
    // Test with predictable values instead of random outcomes
    expect(score1).toBe(80);
    expect(score2).toBe(20);
    expect(score3).toBe(42);
    expect(score1 + score2 + score3).toBe(142);
    
    // Test score generation properties
    expect(typeof score1).toBe('number');
    expect(typeof score2).toBe('number');
    expect(typeof score3).toBe('number');
    expect(score1).toBeGreaterThanOrEqual(0);
    expect(score1).toBeLessThanOrEqual(100);
    
    // Restore original Math.random
    Math.random = originalRandom;
  });

  // FIXED TEST 12: Date/time dependent behavior (deterministic)
  test('should handle time-based logic correctly (FLAKY: date dependent)', () => {
    // Mock Date with specific time: 2023-10-15 10:24:15 (Sunday, business hours, even minute, first half)
    const mockDate = new Date('2023-10-15T10:24:15.000Z');
    const originalDate = global.Date;
    
    global.Date = jest.fn(() => mockDate);
    global.Date.now = jest.fn(() => mockDate.getTime());
    
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentSecond = currentTime.getSeconds();
    
    // Mock time-based feature toggle
    const mockIsFeatureEnabled = () => {
      // Feature enabled only during specific times
      return currentHour >= 9 && currentHour < 17 && currentMinute % 2 === 0;
    };

    const mockGetTimeBasedMessage = () => {
      if (currentSecond < 30) {
        return 'First half of minute';
      } else {
        return 'Second half of minute';
      }
    };

    // Test with predictable time values
    expect(currentHour).toBe(10);
    expect(currentMinute).toBe(24);
    expect(currentSecond).toBe(15);
    expect(mockIsFeatureEnabled()).toBe(true); // 10 is between 9-17, 24 is even
    expect(mockGetTimeBasedMessage()).toBe('First half of minute'); // 15 < 30
    
    // Test time-based logic properties
    expect(typeof currentHour).toBe('number');
    expect(currentHour).toBeGreaterThanOrEqual(0);
    expect(currentHour).toBeLessThanOrEqual(23);
    expect(currentMinute).toBeGreaterThanOrEqual(0);
    expect(currentMinute).toBeLessThanOrEqual(59);
    
    // Restore original Date
    global.Date = originalDate;
  });

  // FIXED TEST 13: Array shuffling properties (deterministic)
  test('should shuffle array in expected order (FLAKY: shuffle randomness)', () => {
    const originalArray = [1, 2, 3, 4, 5];
    const originalRandom = Math.random;
    
    // Mock Math.random with predetermined values for consistent test results
    const mockRandomValues = [0.8, 0.3, 0.6, 0.1];
    let callIndex = 0;
    
    Math.random = jest.fn(() => {
      const value = mockRandomValues[callIndex % mockRandomValues.length];
      callIndex++;
      return value;
    });
    
    // Fisher-Yates shuffle function
    const mockShuffle = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const shuffled1 = mockShuffle(originalArray);
    
    // Test shuffle properties - these tests focus on what a shuffle should guarantee
    expect(shuffled1).toHaveLength(originalArray.length); // Same length
    expect(shuffled1.sort()).toEqual(originalArray.sort()); // Contains same elements
    expect(new Set(shuffled1)).toEqual(new Set(originalArray)); // No duplicates or missing elements
    
    // Test that all original elements are present exactly once
    const elementCounts = {};
    shuffled1.forEach(element => {
      elementCounts[element] = (elementCounts[element] || 0) + 1;
    });
    originalArray.forEach(element => {
      expect(elementCounts[element]).toBe(1);
    });
    
    // Test with edge cases - empty array and single element
    expect(mockShuffle([])).toEqual([]);
    expect(mockShuffle([42])).toEqual([42]);
    
    // Restore original Math.random
    Math.random = originalRandom;
  });

  // FIXED TEST 14: Probability-based outcomes (deterministic)
  test('should handle probability correctly (FLAKY: probability)', () => {
    const originalRandom = Math.random;
    let successCount = 0;
    let failureCount = 0;
    const iterations = 10;
    
    // Mock Math.random with predetermined values (7 successes, 3 failures for 70% rate)
    const mockRandomValues = [0.6, 0.8, 0.3, 0.5, 0.2, 0.9, 0.4, 0.1, 0.75, 0.65];
    let callIndex = 0;
    
    Math.random = jest.fn(() => {
      const value = mockRandomValues[callIndex % mockRandomValues.length];
      callIndex++;
      return value;
    });
    
    // Mock probability-based function (70% success rate)
    const mockProbabilityAction = () => {
      return Math.random() < 0.7;
    };

    // Run multiple iterations
    for (let i = 0; i < iterations; i++) {
      if (mockProbabilityAction()) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    // Test with predictable outcomes based on mocked values
    // Values < 0.7: 0.6, 0.3, 0.5, 0.2, 0.4, 0.1, 0.65 = 7 successes
    // Values >= 0.7: 0.8, 0.9, 0.75 = 3 failures
    expect(successCount).toBe(7);
    expect(failureCount).toBe(3);
    expect(successCount + failureCount).toBe(iterations);
    
    // Test probability function properties
    expect(typeof successCount).toBe('number');
    expect(typeof failureCount).toBe('number');
    expect(successCount).toBeGreaterThanOrEqual(0);
    expect(failureCount).toBeGreaterThanOrEqual(0);
    
    // Restore original Math.random
    Math.random = originalRandom;
  });

  // FIXED TEST 15: Random ID generation collision (deterministic)
  test('should generate unique IDs (FLAKY: ID collision)', () => {
    const originalRandom = Math.random;
    const generatedIds = new Set();
    
    // Mock Math.random to generate predictable sequence (ensuring both unique and duplicate IDs)
    const mockRandomValues = [0.42, 0.15, 0.73, 0.42, 0.89, 0.15, 0.33, 0.67]; // Creates some duplicates
    let callIndex = 0;
    
    Math.random = jest.fn(() => {
      const value = mockRandomValues[callIndex % mockRandomValues.length];
      callIndex++;
      return value;
    });
    
    // Mock simple random ID generator with higher collision probability
    const mockGenerateId = () => {
      return Math.floor(Math.random() * 100).toString(); // Reduced range for more collisions
    };

    // Generate 8 IDs to match our mock values
    const expectedIds = ['42', '15', '73', '42', '89', '15', '33', '67'];
    const generatedIdsList = [];
    
    for (let i = 0; i < 8; i++) {
      const id = mockGenerateId();
      generatedIdsList.push(id);
      generatedIds.add(id);
    }

    // Test with predictable ID generation
    expect(generatedIdsList).toEqual(expectedIds);
    expect(generatedIds.size).toBe(6); // Unique IDs: 42, 15, 73, 89, 33, 67
    expect(Array.from(generatedIds)).toContain('42');
    expect(Array.from(generatedIds)).toContain('15');
    expect(Array.from(generatedIds)).toContain('73');
    expect(Array.from(generatedIds)).not.toContain('99');
    
    // Test ID generation properties
    generatedIds.forEach(id => {
      expect(typeof id).toBe('string');
      const numId = parseInt(id);
      expect(numId).toBeGreaterThanOrEqual(0);
      expect(numId).toBeLessThanOrEqual(99);
    });
    
    // Restore original Math.random
    Math.random = originalRandom;
  });

  // FIXED TEST 16: Random selection from array (deterministic)
  test('should select random items correctly (FLAKY: selection randomness)', () => {
    const originalRandom = Math.random;
    const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
    const selections = [];
    
    // Mock Math.random with predetermined values for specific selections
    // Values will be: 1*5=5, 0*5=0, 2*5=10, 3*5=15, 1*5=5 -> floor: 1, 0, 2, 3, 1
    // Resulting in: banana, apple, cherry, date, banana
    const mockRandomValues = [0.2, 0.05, 0.4, 0.65, 0.35];
    let callIndex = 0;
    
    Math.random = jest.fn(() => {
      const value = mockRandomValues[callIndex % mockRandomValues.length];
      callIndex++;
      return value;
    });
    
    // Mock random selection function
    const mockRandomSelect = (array) => {
      const randomIndex = Math.floor(Math.random() * array.length);
      return array[randomIndex];
    };

    // Make multiple selections
    for (let i = 0; i < 5; i++) {
      selections.push(mockRandomSelect(items));
    }

    // Test with predictable selections
    const expectedSelections = ['banana', 'apple', 'cherry', 'date', 'banana'];
    expect(selections).toEqual(expectedSelections);
    expect(selections[0]).toBe('banana');
    expect(selections).toContain('apple');
    expect(selections).toContain('cherry');
    expect(new Set(selections).size).toBe(4); // banana, apple, cherry, date
    
    // Test selection function properties
    selections.forEach(selection => {
      expect(typeof selection).toBe('string');
      expect(items).toContain(selection);
    });
    
    // Restore original Math.random
    Math.random = originalRandom;
  });

  // FIXED TEST 17: Random delay simulation (deterministic with fake timers)
  test('should handle random delays (FLAKY: delay timing)', () => {
    const originalRandom = Math.random;
    jest.useFakeTimers();
    
    let operationCompleted = false;
    const startTime = Date.now();
    
    // Mock Math.random for predictable delay: 0.5 * 200 + 100 = 200ms
    Math.random = jest.fn(() => 0.5);
    
    // Mock operation with random delay
    const mockRandomDelayOperation = () => {
      const delay = Math.random() * 200 + 100; // 100-300ms
      setTimeout(() => {
        operationCompleted = true;
      }, delay);
    };

    mockRandomDelayOperation();
    
    // Fast-forward time by the expected delay (200ms)
    expect(operationCompleted).toBe(false);
    
    jest.advanceTimersByTime(200);
    expect(operationCompleted).toBe(true);
    
    // Test delay properties
    expect(Math.random).toHaveBeenCalledTimes(1);
    
    // Restore original functions
    Math.random = originalRandom;
    jest.useRealTimers();
  });

  // FIXED TEST 18: Weighted random selection (deterministic)
  test('should respect weighted probabilities (FLAKY: weighted randomness)', () => {
    const originalRandom = Math.random;
    const weights = { common: 0.7, rare: 0.25, legendary: 0.05 };
    const results = { common: 0, rare: 0, legendary: 0 };
    const iterations = 10;
    
    // Mock Math.random with predetermined values to test each weight category
    // legendary: < 0.05, rare: 0.05-0.3, common: >= 0.3
    // Values: 0.02 (legendary), 0.15 (rare), 0.8 (common), 0.4 (common), 0.1 (rare), 
    //         0.03 (legendary), 0.6 (common), 0.25 (rare), 0.9 (common), 0.5 (common)
    const mockRandomValues = [0.02, 0.15, 0.8, 0.4, 0.1, 0.03, 0.6, 0.25, 0.9, 0.5];
    let callIndex = 0;
    
    Math.random = jest.fn(() => {
      const value = mockRandomValues[callIndex % mockRandomValues.length];
      callIndex++;
      return value;
    });
    
    // Mock weighted random selection
    const mockWeightedSelect = () => {
      const random = Math.random();
      if (random < weights.legendary) return 'legendary';
      if (random < weights.legendary + weights.rare) return 'rare';
      return 'common';
    };

    // Run multiple selections
    for (let i = 0; i < iterations; i++) {
      const result = mockWeightedSelect();
      results[result]++;
    }

    // Test with predictable distribution
    // Expected: legendary=2, rare=3, common=5
    expect(results.legendary).toBe(2); // 0.02, 0.03
    expect(results.rare).toBe(3); // 0.15, 0.1, 0.25
    expect(results.common).toBe(5); // 0.8, 0.4, 0.6, 0.9, 0.5
    expect(results.common + results.rare + results.legendary).toBe(iterations);
    
    // Test weighted selection properties
    expect(typeof results.common).toBe('number');
    expect(typeof results.rare).toBe('number');
    expect(typeof results.legendary).toBe('number');
    expect(results.common).toBeGreaterThanOrEqual(0);
    expect(results.rare).toBeGreaterThanOrEqual(0);
    expect(results.legendary).toBeGreaterThanOrEqual(0);
    
    // Restore original Math.random
    Math.random = originalRandom;
  });
});
