
import { Stripe } from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { doc, updateDoc, increment } from 'firebase/firestore';

// --- Définition des correspondances entre Price ID et tickets ---
const priceIdToTickets: { [key: string]: { upload?: number; ai?: number } } = {
    // Packs Upload
    'price_1SQ8wYCL0iCpjJiiuJUOTncv': { upload: 50 },
    'price_1SQ8xyCL0iCpjJiiqW038S9Z': { upload: 120 },
    'price_1SQ8zLCL0iCpjJiiLoxKSEej': { upload: 300 },
    // Packs IA
    'price_1SQ91HCL0iCpjJiiUV4xjJJE': { ai: 20 },
    'price_1SQ92mCL0iCpjJiiK0lISxQ5': { ai: 50 },
    'price_1SQ944CL0iCpjJii3B2LrQnQ': { ai: 150 },
};

const subscriptionPriceIdToTier: { [key: string]: { tier: 'creator' | 'pro' | 'master', upload: number, ai: number } } = {
    'price_1SQ8qMCL0iCpjJiiuReYJAG8': { tier: 'creator', upload: 500, ai: 50 },
    'price_1SQ8sXCL0iCpjJiibM2zG3iO': { tier: 'pro', upload: Infinity, ai: 150 },
    'price_1SQ8uUCL0iCpjJii5P1ZiYMa': { tier: 'master', upload: Infinity, ai: 400 },
};

// Configuration de l'admin Firebase directement dans la route
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

const appName = 'firebase-admin-app-webhook';
if (!getApps().some(app => app.name === appName)) {
  initializeApp({
    credential: cert(serviceAccount!),
  }, appName);
}
const firestoreAdmin = getFirestore(getApp(appName));


/**
 * Gère les événements de webhook Stripe, notamment la finalisation des paiements.
 */
export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('Stripe-Signature') as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("Erreur: La clé secrète du webhook Stripe n'est pas définie dans les variables d'environnement.");
        return new NextResponse('Webhook secret non configuré côté serveur.', { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Erreur de vérification du webhook : ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }
    
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const firebaseUID = session.metadata?.firebaseUID;
        const priceId = session.metadata?.priceId;

        if (!firebaseUID || !priceId) {
            console.error("Métadonnées manquantes (firebaseUID ou priceId) dans la session Stripe.");
            return new NextResponse('Métadonnées de session Stripe manquantes.', { status: 400 });
        }

        const userDocRef = firestoreAdmin.collection('users').doc(firebaseUID);
        
        try {
            if (priceIdToTickets[priceId]) {
                const { upload, ai } = priceIdToTickets[priceId];
                const updates: { [key: string]: any } = {};
                if (upload) updates.packUploadTickets = getFirestore().FieldValue.increment(upload);
                if (ai) updates.packAiTickets = getFirestore().FieldValue.increment(ai);
                
                await userDocRef.update(updates);
                console.log(`Tickets ajoutés pour l'utilisateur ${firebaseUID}:`, updates);

            } else if (subscriptionPriceIdToTier[priceId]) {
                const { tier, upload, ai } = subscriptionPriceIdToTier[priceId];
                const updates = {
                    subscriptionTier: tier,
                    subscriptionUploadTickets: upload === Infinity ? 999999 : upload,
                    subscriptionAiTickets: ai,
                };
                await userDocRef.update(updates);
                console.log(`Abonnement '${tier}' activé pour l'utilisateur ${firebaseUID}.`);
            } else {
                 console.warn(`Price ID ${priceId} non géré.`);
            }

        } catch (error) {
            console.error("Erreur lors de la mise à jour du profil utilisateur via webhook:", error);
            return new NextResponse('Erreur interne lors de la mise à jour du compte.', { status: 500 });
        }
    }

    return new NextResponse(null, { status: 200 });
}
