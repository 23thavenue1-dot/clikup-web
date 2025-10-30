
'use client';

import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
  type UploadTaskSnapshot,
} from 'firebase/storage';
import type { User } from 'firebase/auth';

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
// Upload (Firebase Storage)
// -----------------------------
type UploadMetadata = {
    originalName: string;
    storagePath: string;
    directUrl: string;
    bbCode: string;
    htmlCode: string;
    mimeType: string;
    fileSize: number;
}

export function uploadFileAndGetMetadata(
  storage: FirebaseStorage,
  user: User,
  file: File,
  customName: string,
  onProgress: (progress: number) => void
): Promise<UploadMetadata> {
  return new Promise((resolve, reject) => {

    if (file.size > MAX_BYTES) {
      return reject(new Error(`Fichier trop volumineux (> ${MAX_BYTES / 1024 / 1024} Mo).`));
    }
    if (!ALLOWED_MIME.test(file.type) && !NAME_EXT_FALLBACK.test(file.name)) {
      return reject(new Error('Type de fichier non autorisé (images uniquement).'));
    }

    const finalName = customName || file.name;
    const filePath = `uploads/${user.uid}/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, filePath);
    const task = uploadBytesResumable(fileRef, file);

    task.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error: any) => {
        console.error("Erreur détaillée de l'upload:", error);
        console.error(`Code: ${error.code}, Message: ${error.message}, Nom: ${error.name}`);
        reject(new Error(`Permission refusée: vérifiez les règles de sécurité de Storage et l'authentification de l'utilisateur.`));
      },
      async () => {
        try {
          const directUrl = await getDownloadURL(task.snapshot.ref);
          const bbCode = `[img]${directUrl}[/img]`;
          const htmlCode = `<img src="${directUrl}" alt="${finalName}" />`;

          resolve({
            originalName: finalName,
            storagePath: filePath,
            directUrl,
            bbCode,
            htmlCode,
            mimeType: file.type,
            fileSize: file.size,
          });
        } catch (error) {
            console.error("Erreur lors de la récupération de l'URL de téléchargement:", error);
            reject(new Error("Impossible d'obtenir l'URL de l'image après le téléversement."));
        }
      }
    );
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
