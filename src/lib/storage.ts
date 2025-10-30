
'use client';

// -----------------------------
// Config côté client (guards)
// -----------------------------
export const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo
export const ALLOWED_MIME = /^(image\/.*)$/i;
const NAME_EXT_FALLBACK = /\.(png|jpe?g|gif|webp|avif|heic|heif|svg)$/i;


/**
 * Converts a File object to a Base64-encoded Data URL.
 * This is our primary upload method, bypassing Firebase Storage due to environment issues.
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
