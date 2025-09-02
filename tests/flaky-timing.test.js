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

  // FIXED TEST 1: Properly wait for async operations
  test('should load data with proper timing', async () => {
    const button = document.getElementById('load-data-btn');
    const display = document.getElementById('data-display');
    const spinner = document.querySelector('.spinner');
    
    // Mock async data loading with predictable delay
    const mockLoadData = () => {
      return new Promise((resolve) => {
        const delay = 150; // Fixed delay for predictability
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
    
    // Now assertions run after data is loaded
    expect(display.textContent).toBe('Data loaded!');
    expect(spinner.style.display).toBe('none');
  });

  // FIXED TEST 2: Animation timing with proper wait
  test('should complete animation within expected time', async () => {
    const target = document.querySelector('.animation-target');
    let animationStarted = false;
    let animationCompleted = false;
    
    // Mock animation with promise-based completion
    const mockAnimate = () => {
      return new Promise((resolve) => {
        animationStarted = true;
        target.style.transition = 'transform 0.3s ease';
        target.style.transform = 'translateX(100px)';
        
        // Use fixed timing for animation completion instead of random
        const animationDuration = 300; // Fixed 300ms duration
        setTimeout(() => {
          animationCompleted = true;
          resolve();
        }, animationDuration);
      });
    };

    // Wait for animation to actually complete using async/await
    await mockAnimate();
    
    // Now check after animation is guaranteed to be done
    expect(animationStarted).toBe(true);
    expect(animationCompleted).toBe(true);
    expect(target.style.transform).toBe('translateX(100px)');
  });

  // FIXED TEST 3: Wait for all async operations
  test('should handle multiple async operations', async () => {
    const results = [];
    
    // Mock multiple async operations with fixed delays
    const asyncOp1 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op1');
        resolve('op1');
      }, 100);
    });
    
    const asyncOp2 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op2');
        resolve('op2');
      }, 150);
    });
    
    const asyncOp3 = () => new Promise(resolve => {
      setTimeout(() => {
        results.push('op3');
        resolve('op3');
      }, 200);
    });

    // Start all operations and wait for ALL to complete
    const promises = [asyncOp1(), asyncOp2(), asyncOp3()];
    await Promise.all(promises);
    
    // Now all operations are guaranteed to be complete
    expect(results).toContain('op1');
    expect(results).toContain('op2');
    expect(results).toContain('op3');
    expect(results).toHaveLength(3);
  });

  // FIXED TEST 4: Properly wait for debounce completion
  test('should handle debounced events correctly', async () => {
    let eventCount = 0;
    let lastEventTime = 0;
    
    // Mock debounced event handler with promise-based completion
    const createDebouncedHandler = () => {
      let timeout;
      let resolvePromise;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      
      const handler = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          eventCount++;
          lastEventTime = Date.now();
          resolvePromise();
        }, 180); // 180ms debounce
      };
      
      return { handler, promise };
    };

    const { handler, promise } = createDebouncedHandler();
    
    // Trigger multiple events rapidly
    handler();
    setTimeout(() => handler(), 50);
    setTimeout(() => handler(), 100);
    setTimeout(() => handler(), 150);
    
    // Wait for debounce to complete
    await promise;
    
    // Now check after debounce has fired
    expect(eventCount).toBe(1);
    expect(lastEventTime).toBeGreaterThan(0);
  });

  // FIXED TEST 5: Test promise resolution without assuming order
  test('should resolve all promises regardless of order', async () => {
    const resolveOrder = [];
    
    // Create promises with deterministic delays to ensure predictable order
    const promise1 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('first');
        resolve('first');
      }, 150); // Fixed 150ms
    });
    
    const promise2 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('second');
        resolve('second');
      }, 200); // Fixed 200ms
    });
    
    const promise3 = new Promise(resolve => {
      setTimeout(() => {
        resolveOrder.push('third');
        resolve('third');
      }, 100); // Fixed 100ms
    });

    await Promise.all([promise1, promise2, promise3]);
    
    // Test that all promises resolved, with predictable order based on fixed delays
    expect(resolveOrder).toHaveLength(3);
    expect(resolveOrder[0]).toBe('third'); // 100ms - resolves first
    expect(resolveOrder[1]).toBe('first'); // 150ms - resolves second
    expect(resolveOrder[2]).toBe('second'); // 200ms - resolves last
  });
});
