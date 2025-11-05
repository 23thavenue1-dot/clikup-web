
import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
// Cette initialisation est pour le côté serveur (API routes, Server Actions)
// Elle utilise les crédentiels d'administrateur

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

const appName = 'firebase-admin-app';

let app = getApps().find(app => app.name === appName);

if (!app) {
    if (serviceAccount) {
        app = initializeApp({
            credential: cert(serviceAccount)
        }, appName);
    } else {
        // Fallback pour les environnements de développement sans la variable d'environnement
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY non définie. Initialisation de l'app admin par défaut.");
        app = initializeApp(undefined, appName);
    }
}

const firestore = getFirestore(app);
const auth = getAuth(app);

export function initializeFirebase() {
    return { firestore, auth, app };
}
