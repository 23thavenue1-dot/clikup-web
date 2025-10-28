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

type ImageMetadata = {
  id: string;
  name: string;
  storagePath: string;
  downloadURL: string;
  contentType: string;
  size: number;
  createdAt: any;
};

export function saveImageMetadata(
  firestore: Firestore,
  user: User,
  metadata: Omit<ImageMetadata, 'createdAt' | 'id'>
) {
  const imageId = doc(collection(firestore, `users/${user.uid}/images`)).id;

  const imageRef = doc(firestore, `users/${user.uid}/images/${imageId}`);
  const dataToSave = {
    ...metadata,
    id: imageId,
    userId: user.uid,
    createdAt: serverTimestamp(),
  };

  setDoc(imageRef, dataToSave).catch((error) => {
    console.error('Error saving image metadata:', error);
    const permissionError = new FirestorePermissionError({
      path: imageRef.path,
      operation: 'create',
      requestResourceData: dataToSave,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
