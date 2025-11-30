'use client';

import { FirebaseError } from 'firebase/app';
import { getAuth, type User } from 'firebase/auth';

/**
 * Classe de base pour toutes les erreurs personnalisées
 */
export abstract class AppError extends Error {
  public readonly timestamp: Date;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly isRetryable: boolean;

  constructor(
    userMessage: string,
    technicalMessage: string,
    isRetryable: boolean = false
  ) {
    super(technicalMessage);
    this.name = this.constructor.name;
    this.userMessage = userMessage;
    this.technicalMessage = technicalMessage;
    this.isRetryable = isRetryable;
    this.timestamp = new Date();
  }
}

/**
 * Erreur d'authentification Firebase
 */
export class AuthError extends AppError {
  public readonly code: string;

  constructor(error: FirebaseError) {
    const { userMessage, isRetryable } = getAuthErrorDetails(error.code);
    super(userMessage, error.message, isRetryable);
    this.code = error.code;
  }
}

/**
 * Erreur de permission Firestore (améliorée)
 */
type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface FirebaseAuthToken {
  name: string | null;
  email: string | null;
  email_verified: boolean;
  phone_number: string | null;
  sub: string;
  firebase: {
    identities: Record<string, string[]>;
    sign_in_provider: string;
    tenant: string | null;
  };
}

interface FirebaseAuthObject {
  uid: string;
  token: FirebaseAuthToken;
}

interface SecurityRuleRequest {
  auth: FirebaseAuthObject | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

function buildAuthObject(currentUser: User | null): FirebaseAuthObject | null {
  if (!currentUser) {
    return null;
  }
  const token: FirebaseAuthToken = {
    name: currentUser.displayName,
    email: currentUser.email,
    email_verified: currentUser.emailVerified,
    phone_number: currentUser.phoneNumber,
    sub: currentUser.uid,
    firebase: {
      identities: currentUser.providerData.reduce((acc, p) => {
        if (p.providerId) {
          acc[p.providerId] = [p.uid];
        }
        return acc;
      }, {} as Record<string, string[]>),
      sign_in_provider: currentUser.providerData[0]?.providerId || 'custom',
      tenant: currentUser.tenantId,
    },
  };
  return { uid: currentUser.uid, token: token };
}

function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  let authObject: FirebaseAuthObject | null = null;
  try {
    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) {
      authObject = buildAuthObject(currentUser);
    }
  } catch {}

  return {
    auth: authObject,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

function buildPermissionErrorMessage(requestObject: SecurityRuleRequest): string {
  return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(requestObject, null, 2)}`;
}

export class FirestorePermissionError extends AppError {
  public readonly path: string;
  public readonly operation: string;
  public readonly requestResourceData?: any;
  public readonly request: SecurityRuleRequest;

  constructor(details: SecurityRuleContext) {
    const requestObject = buildRequestObject(details);
    const userMessage = "Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
    const technicalMessage = buildPermissionErrorMessage(requestObject);
    
    super(userMessage, technicalMessage, false);
    this.name = 'FirestorePermissionError';
    this.path = details.path;
    this.operation = details.operation;
    this.requestResourceData = details.requestResourceData;
    this.request = requestObject;
  }
}

/**
 * Erreur générique Firestore
 */
export class GeneralFirestoreError extends AppError {
  public readonly code: string;
  public readonly path?: string;

  constructor(error: FirebaseError, path?: string) {
    const { userMessage, isRetryable } = getFirestoreErrorDetails(error.code);
    super(userMessage, error.message, isRetryable);
    this.code = error.code;
    this.path = path;
    this.name = 'FirestoreError';
  }
}

/**
 * Erreur Storage
 */
export class StorageError extends AppError {
  public readonly code: string;
  public readonly path?: string;

  constructor(error: FirebaseError, path?: string) {
    const { userMessage, isRetryable } = getStorageErrorDetails(error.code);
    super(userMessage, error.message, isRetryable);
    this.code = error.code;
    this.path = path;
    this.name = 'StorageError';
  }
}

/**
 * Erreur réseau
 */
export class NetworkError extends AppError {
  constructor(originalError: Error) {
    super(
      "Problème de connexion internet. Veuillez vérifier votre connexion.",
      originalError.message,
      true
    );
    this.name = 'NetworkError';
  }
}

/**
 * Erreur de validation
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, message, false);
    this.field = field;
    this.name = 'ValidationError';
  }
}

// ============= Helpers =============

function getAuthErrorDetails(code: string): { userMessage: string; isRetryable: boolean } {
  const errorMap: Record<string, { userMessage: string; isRetryable: boolean }> = {
    'auth/user-not-found': { userMessage: 'Aucun compte ne correspond à cet email.', isRetryable: false },
    'auth/wrong-password': { userMessage: 'Mot de passe incorrect.', isRetryable: false },
    'auth/email-already-in-use': { userMessage: 'Un compte existe déjà avec cet email.', isRetryable: false },
    'auth/weak-password': { userMessage: 'Le mot de passe doit contenir au moins 6 caractères.', isRetryable: false },
    'auth/invalid-email': { userMessage: 'Format d\'email invalide.', isRetryable: false },
    'auth/network-request-failed': { userMessage: 'Problème de connexion. Vérifiez votre réseau.', isRetryable: true },
    'auth/too-many-requests': { userMessage: 'Trop de tentatives. Réessayez dans quelques minutes.', isRetryable: true },
    'auth/user-disabled': { userMessage: 'Ce compte a été désactivé.', isRetryable: false },
  };
  return errorMap[code] || { userMessage: 'Une erreur d\'authentification est survenue.', isRetryable: false };
}

function getFirestoreErrorDetails(code: string): { userMessage: string; isRetryable: boolean } {
  const errorMap: Record<string, { userMessage: string; isRetryable: boolean }> = {
    'permission-denied': { userMessage: 'Accès refusé. Vérifiez vos permissions.', isRetryable: false },
    'not-found': { userMessage: 'Document introuvable.', isRetryable: false },
    'already-exists': { userMessage: 'Ce document existe déjà.', isRetryable: false },
    'resource-exhausted': { userMessage: 'Quota dépassé. Réessayez plus tard.', isRetryable: true },
    'unavailable': { userMessage: 'Service temporairement indisponible.', isRetryable: true },
    'unauthenticated': { userMessage: 'Vous devez être connecté pour effectuer cette action.', isRetryable: false },
  };
  return errorMap[code] || { userMessage: 'Erreur lors de l\'accès à la base de données.', isRetryable: false };
}

function getStorageErrorDetails(code: string): { userMessage: string; isRetryable: boolean } {
  const errorMap: Record<string, { userMessage: string; isRetryable: boolean }> = {
    'storage/unauthorized': { userMessage: 'Vous n\'avez pas l\'autorisation d\'accéder à ce fichier.', isRetryable: false },
    'storage/canceled': { userMessage: 'L\'opération a été annulée.', isRetryable: false },
    'storage/object-not-found': { userMessage: 'Fichier introuvable.', isRetryable: false },
    'storage/quota-exceeded': { userMessage: 'Quota de stockage dépassé.', isRetryable: false },
    'storage/unauthenticated': { userMessage: 'Authentification requise pour accéder au fichier.', isRetryable: false },
    'storage/retry-limit-exceeded': { userMessage: 'Trop de tentatives. Réessayez plus tard.', isRetryable: true },
  };
  return errorMap[code] || { userMessage: 'Erreur lors de l\'accès au fichier.', isRetryable: false };
}
