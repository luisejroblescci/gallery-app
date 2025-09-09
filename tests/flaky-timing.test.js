/**
 * @jest-environment jsdom
 */

describe('Flaky Timing-Based Tests', () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="async-container">
        <button id="load-data-btn">Load Data</button>
        <div id="data-display"></div>
        <div class="spinner" style="display: none;">Loading...</div>
      </div>
      <div class="animation-target"></div>
      <div class="delayed-element" style="opacity: 0;"></div>
    `;
    document.body.innerHTML = mockHTML;
  });

  // FIXED TEST 1: Wait for actual completion instead of fixed timing
  test('should load data with proper timing (FLAKY: race condition)', async () => {
    const button = document.getElementById('load-data-btn');
    const display = document.getElementById('data-display');
    const spinner = document.querySelector('.spinner');
    
    // Mock async data loading with random delay
    const mockLoadData = () => {
      return new Promise((resolve) => {
        // Random delay between 80-200ms - creates more race condition opportunities
        const delay = Math.random() * 120 + 80;
        setTimeout(() => {
          display.textContent = 'Data loaded!';
          spinner.style.display = 'none';
          resolve('success');
        }, delay);
      });
    };

    spinner.style.display = 'block';
    
    // Start loading and wait for completion
    await mockLoadData();
    
    // Assert after actual completion - no race condition
    expect(display.textContent).toBe('Data loaded!');
    expect(spinner.style.display).toBe('none');
  });

  // FIXED TEST 2: Wait for animation completion using Promise
  test('should complete animation within expected time (FLAKY: animation timing)', async () => {
    const target = document.querySelector('.animation-target');
    let animationStarted = false;
    
    // Mock animation with variable duration that returns a Promise
    const mockAnimate = () => {
      return new Promise((resolve) => {
        animationStarted = true;
        target.style.transition = 'transform 0.3s ease';
        target.style.transform = 'translateX(100px)';
        
        // Animation completion detection with timing issues - now more variable
        setTimeout(() => {
          resolve();
        }, 200 + Math.random() * 200); // 200-400ms - much more inconsistent timing
      });
    };

    // Wait for animation to actually complete
    await mockAnimate();
    
    // Assert after actual completion - no race condition
    expect(animationStarted).toBe(true);
    expect(target.style.transform).toBe('translateX(100px)');
  });

  // FIXED TEST 3: Wait for ALL async operations to complete
  test('should handle multiple async operations (FLAKY: insufficient waiting)', async () => {
    const results = [];
    
    // Mock multiple async operations with different delays - increased delays
    const asyncOp1 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op1');
        resolve('op1');
      }, Math.random() * 100 + 50); // 50-150ms
    });
    
    const asyncOp2 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op2');
        resolve('op2');
      }, Math.random() * 150 + 80); // 80-230ms
    });
    
    const asyncOp3 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op3');
        resolve('op3');
      }, Math.random() * 200 + 100); // 100-300ms - much longer delay
    });

    // Start all operations
    const promises = [asyncOp1(), asyncOp2(), asyncOp3()];
    
    // Wait for ALL operations to complete
    await Promise.all(promises);
    
    // Assert after all operations are done - no race condition
    expect(results).toContain('op1');
    expect(results).toContain('op2');
    expect(results).toContain('op3');
    expect(results).toHaveLength(3);
  });

  // FIXED TEST 4: Wait for debounce completion using Promise
  test('should handle debounced events correctly (FLAKY: debounce timing)', async () => {
    let eventCount = 0;
    let lastEventTime = 0;
    
    // Mock debounced event handler that returns Promise
    const mockDebouncedHandler = (() => {
      let timeout;
      let resolveDebounce;
      let debouncePromise = Promise.resolve();
      
      return () => {
        clearTimeout(timeout);
        debouncePromise = new Promise(resolve => {
          resolveDebounce = resolve;
        });
        timeout = setTimeout(() => {
          eventCount++;
          lastEventTime = Date.now();
          resolveDebounce();
        }, 180); // 180ms debounce - longer delay
        return debouncePromise;
      };
    })();

    // Trigger multiple events rapidly and get the final promise
    mockDebouncedHandler();
    setTimeout(() => mockDebouncedHandler(), 50);
    setTimeout(() => mockDebouncedHandler(), 100);
    setTimeout(() => mockDebouncedHandler(), 150);
    const finalPromise = await new Promise(resolve => {
      setTimeout(() => resolve(mockDebouncedHandler()), 200);
    });

    // Wait for debounce to actually complete
    await finalPromise;
    
    // Assert after debounce completion - no race condition
    expect(eventCount).toBe(1);
    expect(lastEventTime).toBeGreaterThan(0);
  });

  // FIXED TEST 5: Test actual completion rather than assuming order
  test('should resolve promises in expected order (FLAKY: promise timing)', async () => {
    const resolveOrder = [];
    
    // Create promises with overlapping random delays - more chaos
    const promise1 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('first');
        resolve('first');
      }, Math.random() * 100 + 50); // 50-150ms
    });
    
    const promise2 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('second');
        resolve('second');
      }, Math.random() * 120 + 40); // 40-160ms
    });
    
    const promise3 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('third');
        resolve('third');
      }, Math.random() * 80 + 30); // 30-110ms
    });

    await Promise.all([promise1, promise2, promise3]);
    
    // Test that all promises resolved rather than assuming specific order
    expect(resolveOrder).toContain('first');
    expect(resolveOrder).toContain('second');
    expect(resolveOrder).toContain('third');
    expect(resolveOrder).toHaveLength(3);
  });
});
