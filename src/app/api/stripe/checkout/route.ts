
import { NextResponse, NextRequest } from 'next/server';
import { createStripeCheckout } from '@/lib/stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';

// Configuration de l'admin Firebase directement dans la route
// C'est la méthode la plus robuste pour les environnements serverless comme Vercel/Next.js
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

const appName = 'firebase-admin-app-checkout';
if (!getApps().some(app => app.name === appName)) {
  initializeApp({
    credential: cert(serviceAccount!),
  }, appName);
}
const firestoreAdmin = getFirestore(getApp(appName));


export async function POST(req: NextRequest) {
    try {
        const { priceId, mode, userId, userEmail } = await req.json();

        if (!priceId || !mode || !userId) {
            return NextResponse.json({ error: { message: 'Les informations de paiement sont incomplètes (priceId, mode, userId).' } }, { status: 400 });
        }
        
        const userInfo = { 
            uid: userId, 
            email: userEmail,
        };

        const session = await createStripeCheckout(priceId, firestoreAdmin, userInfo, mode);

        if (session.url) {
            return NextResponse.json({ url: session.url });
        } else {
             return NextResponse.json({ error: { message: "La création de la session Stripe a échoué." } }, { status: 500 });
        }

    } catch (error) {
        console.error('API Checkout Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Une erreur inconnue est survenue';
        return NextResponse.json({ error: { message: errorMessage } }, { status: 500 });
    }
}
