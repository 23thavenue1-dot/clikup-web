'use client';

import {
  doc,
  setDoc,
  Firestore,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { User } from 'firebase/auth';

// Ce type représente la structure de données attendue pour un document d'image dans Firestore.
// Il est crucial qu'il corresponde au schéma dans backend.json et aux règles de sécurité.
type ImageMetadata = {
  id: string;
  userId: string;
  originalName: string;
  storagePath: string;
  directUrl: string;
  bbCode: string;
  htmlCode: string;
  mimeType: string;
  fileSize: number;
  uploadTimestamp: any; // Firestore server timestamp.
};

// Ce type représente les données de base que nous recevons de la page principale.
type InputMetadata = {
  originalName: string;
  storagePath: string;
  directUrl: string;
  mimeType: string;
  fileSize: number;
};

/**
 * Sauvegarde les métadonnées de l'image dans Firestore dans la sous-collection de l'utilisateur.
 * Cette fonction construit l'objet de données complet, y compris les champs requis par les règles de sécurité.
 * @param firestore L'instance Firestore.
 * @param user L'objet utilisateur authentifié.
 * @param metadata Un objet contenant les métadonnées de base du téléversement.
 */
export function saveImageMetadata(
  firestore: Firestore,
  user: User,
  metadata: InputMetadata
) {
  // 1. Génère un nouvel ID unique pour le document d'image.
  const imageId = doc(collection(firestore, 'users', user.uid, 'images')).id;

  // 2. Crée une référence à l'emplacement du document.
  const imageRef = doc(firestore, `users/${user.uid}/images/${imageId}`);
  
  // 3. Construit l'objet de données complet à sauvegarder.
  const dataToSave: ImageMetadata = {
    id: imageId, // L'ID propre du document.
    userId: user.uid, // L'ID du propriétaire, requis par les règles.
    originalName: metadata.originalName,
    storagePath: metadata.storagePath,
    directUrl: metadata.directUrl, // Utilise le nom de propriété correct.
    bbCode: `[img]${metadata.directUrl}[/img]`,
    htmlCode: `<img src="${metadata.directUrl}" alt="${metadata.originalName}" />`,
    mimeType: metadata.mimeType,
    fileSize: metadata.fileSize,
    uploadTimestamp: serverTimestamp(),
  };

  // 4. Tente d'écrire le document dans Firestore.
  setDoc(imageRef, dataToSave).catch((error) => {
    console.error('Erreur lors de la sauvegarde des métadonnées de l\'image :', error);
    
    // Crée une erreur contextuelle détaillée pour un meilleur débogage.
    const permissionError = new FirestorePermissionError({
      path: imageRef.path,
      operation: 'create',
      requestResourceData: dataToSave,
    });

    // Émet l'erreur globalement pour qu'elle puisse être interceptée et affichée.
    errorEmitter.emit('permission-error', permissionError);
  });
}
