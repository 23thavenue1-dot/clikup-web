'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret);

admin.initializeApp();

/**
 * Fonction Cloud (v1) qui se déclenche à la création d'un document de paiement.
 * Elle récupère les métadonnées du produit acheté et crédite les tickets à l'utilisateur.
 */
exports.onPaymentSuccess = functions.firestore
    .document('customers/{userId}/payments/{paymentId}')
    .onCreate(async (snap, context) => {
        const payment = snap.data();
        const userId = context.params.userId;

        functions.logger.info(`Déclenchement pour l'utilisateur ${userId}, paiement ${context.params.paymentId}`);

        if (!payment || !payment.items || payment.items.length === 0) {
            functions.logger.error("Le document de paiement ne contient pas d'articles ('items').", { paymentData: payment });
            return null;
        }

        const db = admin.firestore();
        const userRef = db.doc(`users/${userId}`);
        const updates = {};

        try {
            for (const item of payment.items) {
                if (item.price && item.price.product) {
                    const productId = item.price.product;
                    const product = await stripe.products.retrieve(productId);
                    
                    functions.logger.info(`Produit récupéré depuis Stripe : ${product.name}`, { metadata: product.metadata });

                    if (product.metadata && product.metadata.packUploadTickets && Number(product.metadata.packUploadTickets) > 0) {
                        updates.packUploadTickets = admin.firestore.FieldValue.increment(Number(product.metadata.packUploadTickets));
                    }
                    if (product.metadata && product.metadata.packAiTickets && Number(product.metadata.packAiTickets) > 0) {
                        updates.packAiTickets = admin.firestore.FieldValue.increment(Number(product.metadata.packAiTickets));
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                await userRef.set(updates, { merge: true });
                functions.logger.info(`Succès ! Tickets crédités pour l'utilisateur ${userId}.`, { updates });
                return { success: true, updates };
            } else {
                functions.logger.warn("Aucune métadonnée de ticket trouvée sur les produits achetés. Rien à créditer.");
                return null;
            }

        } catch (error) {
            functions.logger.error(`Erreur lors du traitement du paiement pour l'utilisateur ${userId}:`, error);
            return Promise.reject(error);
        }
    });
