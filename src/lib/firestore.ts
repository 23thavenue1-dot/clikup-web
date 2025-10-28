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

// This type represents the data structure of an image document in Firestore.
type ImageMetadata = {
  id: string; // The unique ID of the document itself.
  userId: string; // The ID of the user who owns the image.
  name: string;
  storagePath: string;
  downloadURL: string;
  contentType: string;
  size: number;
  createdAt: any; // Firestore server timestamp.
};

/**
 * Saves image metadata to Firestore in the user's subcollection.
 * This function now correctly includes the userId in the document data to satisfy security rules.
 * @param firestore The Firestore instance.
 * @param user The authenticated user object.
 * @param metadata An object containing the core metadata from the upload.
 */
export function saveImageMetadata(
  firestore: Firestore,
  user: User,
  metadata: Omit<ImageMetadata, 'createdAt' | 'id' | 'userId'>
) {
  // 1. Generate a new unique ID for the image document.
  const imageId = doc(collection(firestore, 'users', user.uid, 'images')).id;

  // 2. Create a reference to the document location.
  const imageRef = doc(firestore, `users/${user.uid}/images/${imageId}`);
  
  // 3. Construct the full data object to save, ensuring it matches the ImageMetadata type
  //    and satisfies security rules.
  const dataToSave: ImageMetadata = {
    ...metadata,
    id: imageId, // The document's own ID.
    userId: user.uid, // The owner's ID, required by security rules.
    createdAt: serverTimestamp(),
  };

  // 4. Attempt to write the document to Firestore.
  setDoc(imageRef, dataToSave).catch((error) => {
    // This .catch() block is crucial for debugging security rule failures.
    console.error('Error saving image metadata:', error);
    
    // Create a detailed, contextual error for better debugging.
    const permissionError = new FirestorePermissionError({
      path: imageRef.path,
      operation: 'create',
      requestResourceData: dataToSave, // Send the exact data we tried to write.
    });

    // Emit the error globally so it can be caught and displayed.
    errorEmitter.emit('permission-error', permissionError);
  });
}
