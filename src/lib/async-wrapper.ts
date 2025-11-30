import { errorHandler } from '@/lib/error-handler';
import { AppError } from '@/firebase/errors';

/**
 * Wrapper pour gérer automatiquement les erreurs des fonctions async
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    const error = errorHandler.handleError(err, context);
    return { data: null, error };
  }
}

/**
 * Retry automatique avec backoff exponentiel
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Operation failed after all retries');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err as Error;
      
      // On ne réessaie que pour les erreurs "retryable"
      const appError = errorHandler.handleError(err);
      if (!appError.isRetryable) {
          throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
