'use client';

import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTask,
  type FirebaseStorage,
} from 'firebase/storage';
import type { User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getIdToken } from 'firebase/auth';


// -----------------------------
// Config côté client (guards)
// -----------------------------
export const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo
export const ALLOWED_MIME = /^(image\/.*)$/i; // On ne garde que les images pour l'instant

// Nettoie un nom de fichier
const sanitize = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

// Construit un chemin qui MATCHE les règles Storage
export const buildStoragePath = (uid: string, fileName: string) =>
  `uploads/${uid}/${fileName}`;

// Mapping d’erreurs pour messages UX
const friendlyStorageError = (e: unknown) => {
  const fe = e as FirebaseError;
  switch (fe?.code) {
    case 'storage/unauthorized':
      return 'Permission refusée : vérifiez les règles de sécurité de Storage et l’authentification de l\'utilisateur.';
    case 'storage/canceled':
      return 'Le téléversement a été annulé.';
    case 'storage/retry-limit-exceeded':
      return 'Impossible d’écrire dans le stockage. Cela est souvent dû à des règles de sécurité non conformes ou à un problème de réseau.';
    case 'storage/invalid-checksum':
      return 'Le fichier semble corrompu. Le téléversement a été interrompu pour garantir l\'intégrité des données.';
    case 'storage/object-not-found':
      return 'Le fichier est introuvable dans l\'espace de stockage.';
    default:
      return fe?.message || 'Une erreur inconnue est survenue lors de l\'opération de stockage.';
  }
};

// -----------------------------
// Upload
// -----------------------------
export function uploadImage(
  storage: FirebaseStorage,
  user: User,
  file: File,
  customName: string,
  onProgress: (progress: number) => void,
  onError: (error: Error) => void,
  onComplete: (downloadURL: string, storagePath: string) => void
): UploadTask {
  
  // Guards locaux
  if (!user?.uid) {
    const error = new Error('Utilisateur non authentifié.');
    onError(error);
    throw error;
  }
   if (!file) {
    const error = new Error('Aucun fichier fourni.');
    onError(error);
    throw error;
  }

  const safeCustom = (customName || '').trim();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const baseName = safeCustom
    ? sanitize(safeCustom)
    : sanitize(file.name.replace(/\.[^/.]+$/, '') || 'image');
  const fileName = `${baseName || 'image'}-${Date.now()}.${ext}`;

  const finalStoragePath = buildStoragePath(user.uid, fileName);
  const ref = storageRef(storage, finalStoragePath);

  // Forcer le rafraîchissement du token est une étape de débogage clé.
  const task = uploadBytesResumable(ref, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: { uid: user.uid },
  });

  task.on(
    'state_changed',
    (snap) => {
      const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
      onProgress(pct);
    },
    (err: any) => {
      console.group('[Storage Upload Error]');
      console.log('code:', err?.code);
      console.log('message:', err?.message);
      console.log('name:', err?.name);
      console.log('serverResponse:', err?.serverResponse);
      console.log('httpStatus:', err?.httpStatus);
      console.log('bucket:', ref.storage.bucket);
      console.log('fullPath:', ref.fullPath);
      console.groupEnd();
      onError(new Error(friendlyStorageError(err)));
    },
    async () => {
      const url = await getDownloadURL(task.snapshot.ref);
      onComplete(url, finalStoragePath);
    }
  );

  return task;
}


// -----------------------------
// Delete
// -----------------------------
export async function deleteImageFile(
  storage: FirebaseStorage,
  storagePath?: string | null
): Promise<void> {
  if (!storagePath) return;
  const ref = storageRef(storage, storagePath);
  try {
    await deleteObject(ref);
  } catch (e: any) {
    if (e?.code === 'storage/object-not-found') {
      console.warn(`Fichier absent (${storagePath}), déjà supprimé ?`);
      return;
    }
    console.error(`Erreur suppression ${storagePath}:`, e);
    throw new Error(friendlyStorageError(e));
  }
}
