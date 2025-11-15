
'use strict';

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const functions = require('firebase-functions');
const Stripe = require('stripe');

// Initialiser Firebase Admin
initializeApp();

// Configurer la clé secrète Stripe via les variables d'environnement des fonctions.
// C'est la méthode sécurisée recommandée.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

/**
 * Fonction Cloud (v2) qui se déclenche à la création d'un document de paiement.
 * Elle récupère les métadonnées du produit acheté directement depuis l'API Stripe
 * et crédite les tickets au bon utilisateur.
 */
exports.onPaymentSuccess = onDocumentCreated("customers/{userId}/payments/{paymentId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        functions.logger.warn("Événement de document vide, arrêt du traitement.");
        return;
    }

    const payment = snap.data();
    const userId = event.params.userId;
    functions.logger.info(`Déclenchement pour l'utilisateur ${userId}, paiement ${event.params.paymentId}`);

    // La logique clé : l'extension écrit les 'items' du paiement.
    if (!payment.items || payment.items.length === 0) {
        functions.logger.error("Le document de paiement ne contient pas d'articles ('items').", { paymentData: payment });
        return;
    }

    const db = getFirestore();
    const userRef = db.doc(`users/${userId}`);
    const updates = {};

    try {
        // Parcourir chaque article acheté (généralement un seul pour les packs)
        for (const item of payment.items) {
            if (item.price && item.price.product) {
                // Obtenir l'ID du produit depuis les données du paiement
                const productId = item.price.product;

                // Appeler l'API Stripe pour récupérer l'objet Produit complet
                const product = await stripe.products.retrieve(productId);
                
                functions.logger.info(`Produit récupéré depuis Stripe : ${product.name}`, { metadata: product.metadata });

                // Vérifier si le produit a des métadonnées pour les tickets d'upload
                if (product.metadata && product.metadata.packUploadTickets && Number(product.metadata.packUploadTickets) > 0) {
                    updates.packUploadTickets = FieldValue.increment(Number(product.metadata.packUploadTickets));
                }
                // Vérifier si le produit a des métadonnées pour les tickets IA
                if (product.metadata && product.metadata.packAiTickets && Number(product.metadata.packAiTickets) > 0) {
                    updates.packAiTickets = FieldValue.increment(Number(product.metadata.packAiTickets));
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            await userRef.set(updates, { merge: true });
            functions.logger.info(`Succès ! Tickets crédités pour l'utilisateur ${userId}.`, { updates });
        } else {
            functions.logger.warn("Aucune métadonnée de ticket trouvée sur les produits achetés. Rien à créditer.");
        }

    } catch (error) {
        functions.logger.error(`Erreur lors du traitement du paiement pour l'utilisateur ${userId}:`, error);
    }
});
