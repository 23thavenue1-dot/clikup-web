
'use server';

import { Stripe } from 'stripe';
import { headers } from 'next/headers';
import type { Firestore } from 'firebase-admin/firestore';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
  typescript: true,
});

type UserInfo = {
    uid: string;
    email: string | null;
    displayName?: string | null;
}

async function getOrCreateCustomer(firestore: Firestore, user: UserInfo): Promise<string> {
    const customerDocRef = firestore.collection('customers').doc(user.uid);
    const customerSnap = await customerDocRef.get();

    if (customerSnap.exists && customerSnap.data()?.stripeId) {
        return customerSnap.data()!.stripeId;
    }

    const customer = await stripe.customers.create({
        email: user.email!,
        name: user.displayName || undefined,
        metadata: {
            firebaseUID: user.uid,
        },
    });

    await customerDocRef.set({ 
        stripeId: customer.id,
        firebaseUID: user.uid,
    });

    return customer.id;
}


export async function createStripeCheckout(priceId: string, firestore: Firestore, user: UserInfo, mode: 'payment' | 'subscription' = 'payment') {
    const customerId = await getOrCreateCustomer(firestore, user);
    
    const origin = headers().get('origin') || 'http://localhost:9002';

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: mode,
        customer: customerId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: `${origin}/`,
        cancel_url: `${origin}/shop`,
        metadata: {
            firebaseUID: user.uid,
            priceId: priceId,
        }
    });

    return session;
}
