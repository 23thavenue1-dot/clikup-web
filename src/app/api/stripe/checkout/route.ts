
import { NextResponse, NextRequest } from 'next/server';
import { createStripeCheckout } from '@/lib/stripe';
import { initializeFirebase } from '@/firebase/server'; // Utilisation de l'initialisation admin

export async function POST(req: NextRequest) {
    try {
        const { priceId, mode, userId, userEmail } = await req.json();

        if (!priceId || !mode || !userId) {
            return NextResponse.json({ error: { message: 'Les informations de paiement sont incomplètes (priceId, mode, userId).' } }, { status: 400 });
        }
        
        // Initialisation de l'admin Firebase pour la communication serveur
        const { firestore } = initializeFirebase();

        // Construire un objet utilisateur simple avec les infos reçues du client
        const userInfo = { 
            uid: userId, 
            email: userEmail,
        };

        const session = await createStripeCheckout(priceId, firestore, userInfo, mode);

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
