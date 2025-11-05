
import { NextResponse, NextRequest } from 'next/server';
import { createStripeCheckout } from '@/lib/stripe';
import { initializeFirebase } from '@/firebase/server'; // Nous aurons besoin d'une initialisation côté serveur

export async function POST(req: NextRequest) {
    try {
        const { priceId, mode } = await req.json();

        if (!priceId) {
            return new NextResponse('Price ID is required', { status: 400 });
        }
        
        // Côté serveur, nous devons authentifier l'utilisateur. 
        // Pour l'instant, nous allons simuler un utilisateur pour la création.
        // Une vraie application nécessiterait de valider un token d'authentification.
        const { auth, firestore } = initializeFirebase();

        // Cette partie devra être remplacée par une vraie gestion de l'utilisateur connecté
        // Pour l'exemple, nous allons simuler un utilisateur.
        // NOTE: CECI N'EST PAS SÉCURISÉ POUR LA PRODUCTION
        const user = { 
            uid: 'mock-uid-replace-with-real-auth', 
            email: 'mock-user@example.com',
            displayName: 'Mock User'
        };


        // @ts-ignore
        const session = await createStripeCheckout(priceId, firestore, user, mode);

        if (session.url) {
            return NextResponse.json({ url: session.url });
        } else {
             return new NextResponse('Failed to create Stripe session', { status: 500 });
        }

    } catch (error) {
        console.error('API Checkout Error:', error);
        return new NextResponse((error as Error).message, { status: 500 });
    }
}
