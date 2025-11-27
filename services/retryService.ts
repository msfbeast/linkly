/**
 * Options for configuring retry behavior
 */
export interface RetryOptions {
  maxRetries: number;      // default: 3
  baseDelayMs: number;     // default: 1000
  maxDelayMs: number;      // default: 10000
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Calculate delay with exponential backoff
 * Formula: min(baseDelay * 2^attempt, maxDelay)
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  return Math.min(exponentialDelay, maxDelayMs);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry service that executes operations with exponential backoff
 * 
 * @param operation - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the operation result
 * @throws The last error if all retries are exhausted
 */
export async function execute<T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw immediately
      if (attempt === config.maxRetries) {
        throw lastError;
      }

      // Call onRetry callback if provided
      if (config.onRetry) {
        config.onRetry(attempt + 1, lastError);
      }

      // Calculate and wait for backoff delay
      const delay = calculateBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs);
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError ?? new Error('Retry failed');
}

/**
 * Retry service object for dependency injection
 */
export const retryService = {
  execute,
  calculateBackoffDelay,
};

export default retryService;
