import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { execute, calculateBackoffDelay } from '../retryService';

/**
 * **Feature: production-analytics, Property 3: Retry behavior on failure**
 * **Validates: Requirements 1.4, 6.1**
 * 
 * For any operation that fails, the retry service SHALL attempt the operation
 * up to maxRetries times before throwing, with delays following exponential backoff pattern.
 */
describe('RetryService Property Tests', () => {
  /**
   * Property 3: Retry behavior on failure
   * For any maxRetries value, a failing operation should be attempted exactly maxRetries + 1 times
   */
  it('should attempt operation exactly maxRetries + 1 times before throwing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 5 }), // maxRetries (keep small for test speed)
        async (maxRetries) => {
          let attemptCount = 0;
          const failingOperation = async () => {
            attemptCount++;
            throw new Error('Always fails');
          };

          try {
            await execute(failingOperation, {
              maxRetries,
              baseDelayMs: 1, // Use minimal delay for tests
              maxDelayMs: 10,
            });
          } catch {
            // Expected to throw
          }

          // Should attempt initial try + maxRetries retries
          expect(attemptCount).toBe(maxRetries + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Exponential backoff pattern
   * For any attempt number, the delay should follow exponential backoff formula
   */
  it('should calculate delays following exponential backoff pattern', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }), // attempt
        fc.integer({ min: 1, max: 1000 }), // baseDelayMs
        fc.integer({ min: 1000, max: 30000 }), // maxDelayMs
        (attempt, baseDelayMs, maxDelayMs) => {
          const delay = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs);
          const expectedExponential = baseDelayMs * Math.pow(2, attempt);
          const expectedDelay = Math.min(expectedExponential, maxDelayMs);

          expect(delay).toBe(expectedDelay);
          expect(delay).toBeGreaterThanOrEqual(baseDelayMs);
          expect(delay).toBeLessThanOrEqual(maxDelayMs);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Successful operation returns immediately
   * For any successful operation, it should return without retries
   */
  it('should return immediately on success without retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.anything(), // return value
        fc.integer({ min: 1, max: 5 }), // maxRetries
        async (returnValue, maxRetries) => {
          let attemptCount = 0;
          const successfulOperation = async () => {
            attemptCount++;
            return returnValue;
          };

          const result = await execute(successfulOperation, {
            maxRetries,
            baseDelayMs: 1,
            maxDelayMs: 10,
          });

          expect(attemptCount).toBe(1);
          expect(result).toBe(returnValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: onRetry callback is called for each retry
   * For any failing operation, onRetry should be called exactly maxRetries times
   */
  it('should call onRetry callback for each retry attempt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // maxRetries
        async (maxRetries) => {
          const retryAttempts: number[] = [];
          const failingOperation = async () => {
            throw new Error('Always fails');
          };

          try {
            await execute(failingOperation, {
              maxRetries,
              baseDelayMs: 1,
              maxDelayMs: 10,
              onRetry: (attempt) => {
                retryAttempts.push(attempt);
              },
            });
          } catch {
            // Expected to throw
          }

          // onRetry should be called for each retry (not the initial attempt)
          expect(retryAttempts.length).toBe(maxRetries);
          // Attempts should be sequential: 1, 2, 3, ...
          expect(retryAttempts).toEqual(
            Array.from({ length: maxRetries }, (_, i) => i + 1)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Operation succeeding on Nth attempt
   * For any operation that succeeds on attempt N (where N <= maxRetries + 1),
   * it should return successfully after exactly N attempts
   */
  it('should succeed when operation passes on any attempt within retry limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }), // successOnAttempt
        fc.integer({ min: 3, max: 5 }), // maxRetries (ensure >= successOnAttempt - 1)
        async (successOnAttempt, maxRetries) => {
          let attemptCount = 0;
          const eventuallySuccessfulOperation = async () => {
            attemptCount++;
            if (attemptCount < successOnAttempt) {
              throw new Error(`Fail on attempt ${attemptCount}`);
            }
            return 'success';
          };

          const result = await execute(eventuallySuccessfulOperation, {
            maxRetries,
            baseDelayMs: 1,
            maxDelayMs: 10,
          });

          expect(result).toBe('success');
          expect(attemptCount).toBe(successOnAttempt);
        }
      ),
      { numRuns: 100 }
    );
  });
});
