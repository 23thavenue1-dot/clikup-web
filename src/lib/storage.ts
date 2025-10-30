
'use client';

import {
  ref as storageRef,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage';

// -----------------------------
// Config côté client (guards)
// -----------------------------
export const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo
export const ALLOWED_MIME = /^(image\/.*)$/i;
const NAME_EXT_FALLBACK = /\.(png|jpe?g|gif|webp|avif|heic|heif|svg)$/i;


/**
 * Converts a File object to a Base64-encoded Data URL.
 * This is a workaround for development environments where the Storage SDK might be blocked.
 * @param file The file to convert.
 * @returns A promise that resolves with the Data URL string.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Perform checks before reading the file
    if (file.size > MAX_BYTES) {
      return reject(new Error('Fichier trop volumineux (> 10 Mo).'));
    }
    if (!ALLOWED_MIME.test(file.type) && !NAME_EXT_FALLBACK.test(file.name)) {
      return reject(new Error('Type de fichier non autorisé (images uniquement).'));
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}


// -----------------------------
// Delete
// -----------------------------
export async function deleteImageFile(
  storage: FirebaseStorage,
  storagePath?: string | null
): Promise<void> {
  // Ne pas tenter de supprimer si c'est un chemin de contournement
  if (!storagePath || storagePath === 'data_url') {
      console.log("Suppression de fichier annulée : l'image est stockée en Data URL dans Firestore.");
      return;
  }
  const ref = storageRef(storage, storagePath);
  try {
    await deleteObject(ref);
  } catch (e: any) {
    if (e?.code === 'storage/object-not-found') {
      console.warn(`Fichier absent (${storagePath}), déjà supprimé ?`);
      return;
    }
    console.error(`Erreur suppression ${storagePath}:`, e);
    // Dans ce contexte, on ne relance pas l'erreur pour ne pas bloquer l'UX si seule la suppression du fichier échoue
  }
}
