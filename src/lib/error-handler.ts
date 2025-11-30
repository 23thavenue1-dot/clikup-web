import { FirebaseError } from 'firebase/app';
import {
  AppError,
  AuthError,
  GeneralFirestoreError,
  StorageError,
  NetworkError,
  ValidationError,
  FirestorePermissionError,
} from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * Type pour les logs d'erreur
 */
export interface ErrorLog {
  id: string;
  error: AppError;
  context?: Record<string, any>;
  userId?: string;
}

/**
 * Service centralisé de gestion d'erreurs
 */
class ErrorHandlerService {
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 100;

  /**
   * Traite une erreur et la transforme en AppError
   */
  handleError(error: unknown, context?: Record<string, any>): AppError {
    let appError: AppError;

    // Identification du type d'erreur
    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof FirebaseError) {
      appError = this.handleFirebaseError(error, context);
    } else if (error instanceof Error) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
         appError = new NetworkError(error);
      } else {
        appError = new ValidationError(error.message); // Erreur générique
      }
    } else {
      appError = new ValidationError('Une erreur inconnue est survenue.');
    }

    // Logging
    this.logError(appError, context);

    // Notification via l'émetteur
    // Si c'est une permission error, on garde l'ancien canal pour Next.js overlay
    if (appError instanceof FirestorePermissionError) {
        errorEmitter.emit('permission-error', appError);
    } else {
        errorEmitter.emit('error', appError);
    }
    
    return appError;
  }

  /**
   * Gère spécifiquement les erreurs Firebase
   */
  private handleFirebaseError(error: FirebaseError, context?: Record<string, any>): AppError {
    const code = error.code;

    if (code.startsWith('auth/')) {
      return new AuthError(error);
    } else if (code.startsWith('storage/')) {
      return new StorageError(error, context?.path);
    } else {
      // Pour Firestore, on distingue permission-denied des autres
      if (code === 'permission-denied' && context) {
          return new FirestorePermissionError({
              path: context.path,
              operation: context.operation,
              requestResourceData: context.requestResourceData,
          });
      }
      return new GeneralFirestoreError(error, context?.path);
    }
  }

  /**
   * Enregistre une erreur dans les logs
   */
  private logError(error: AppError, context?: Record<string, any>): void {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      error,
      context,
      userId: context?.userId,
    };

    this.errorLogs.unshift(errorLog);

    // Limiter la taille des logs
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
    }

    // Log console en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('🔴 Error caught:', {
        type: error.name,
        userMessage: error.userMessage,
        technicalMessage: error.technicalMessage,
        context,
        timestamp: error.timestamp,
        isRetryable: error.isRetryable,
        originalError: error,
      });
    }
  }

  /**
   * Récupère tous les logs d'erreur
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Vide les logs d'erreur
   */
  clearErrorLogs(): void {
    this.errorLogs = [];
  }
}

export const errorHandler = new ErrorHandlerService();
