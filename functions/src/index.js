
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');

// Initialiser l'admin Firebase et Stripe
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Récupérer la clé secrète depuis les variables d'environnement de la fonction
// C'est la méthode la plus sécurisée.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

/**
 * Fonction qui se déclenche à la création d'un document de paiement par l'extension Stripe.
 * Elle récupère les métadonnées du produit acheté directement depuis l'API Stripe et crédite les tickets à l'utilisateur.
 */
exports.onPaymentSuccess = functions.firestore
  .document('/customers/{userId}/payments/{paymentId}')
  .onCreate(async (snap, context) => {
    const paymentData = snap.data();
    const userId = context.params.userId;
    functions.logger.info(`Nouvel événement de paiement détecté pour l'utilisateur ${userId}.`, { paymentId: context.params.paymentId });

    if (!paymentData || !paymentData.items || paymentData.items.length === 0) {
        functions.logger.error("Document de paiement incomplet ou sans 'items'.", { data: paymentData });
        return null;
    }

    try {
        const line_items = paymentData.items;
        const updates = {};

        for (const item of line_items) {
            // S'assurer que le produit existe bien dans l'item
            if (item.price && item.price.product) {
                 // Appel à l'API Stripe pour récupérer le produit complet avec ses métadonnées
                 const product = await stripe.products.retrieve(item.price.product);
                 
                 // Mise à jour du document de paiement avec le nom du produit pour l'historique
                 await snap.ref.update({ 'items.0.price.product.name': product.name });

                 if (product && product.metadata) {
                    functions.logger.info(`Traitement du produit : ${product.name}`, { metadata: product.metadata });
                    
                    // Vérifier si le produit a des métadonnées pour les tickets d'upload
                    if (product.metadata.packUploadTickets && Number(product.metadata.packUploadTickets) > 0) {
                        updates.packUploadTickets = admin.firestore.FieldValue.increment(Number(product.metadata.packUploadTickets));
                        functions.logger.info(`Ajout de ${product.metadata.packUploadTickets} tickets d'upload.`);
                    }
                    // Vérifier si le produit a des métadonnées pour les tickets IA
                    if (product.metadata.packAiTickets && Number(product.metadata.packAiTickets) > 0) {
                        updates.packAiTickets = admin.firestore.FieldValue.increment(Number(product.metadata.packAiTickets));
                        functions.logger.info(`Ajout de ${product.metadata.packAiTickets} tickets IA.`);
                    }
                }
            }
        }
        
        if (Object.keys(updates).length > 0) {
            const userRef = admin.firestore().collection('users').doc(userId);
            await userRef.update(updates);
            functions.logger.info(`Succès : Le profil de l'utilisateur ${userId} a été mis à jour.`, { updates });
            return { success: true, userId, updates };
        } else {
            functions.logger.warn("Aucune métadonnée de ticket trouvée sur les produits achetés.", { line_items });
            return null;
        }

    } catch (error) {
        functions.logger.error("Erreur lors de la récupération des détails depuis Stripe ou de la mise à jour Firestore :", error);
        return Promise.reject(error);
    }
});
