
'use strict';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialiser l'admin Firebase et Stripe
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Initialisation de Stripe avec la clé secrète depuis les variables d'environnement des fonctions
// Note: Vous devez configurer cette variable dans votre environnement Firebase.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

/**
 * Fonction qui se déclenche à la création d'un document de paiement par l'extension Stripe.
 * Elle récupère les métadonnées du produit acheté et crédite les tickets à l'utilisateur.
 */
export const onPaymentSuccess = functions.firestore
  .document('/customers/{userId}/payments/{paymentId}')
  .onCreate(async (snap, context) => {
    const paymentData = snap.data();
    const userId = context.params.userId;
    functions.logger.info(`Nouvel événement de paiement détecté pour l'utilisateur ${userId}.`, { paymentId: context.params.paymentId });

    if (!paymentData || !paymentData.items || paymentData.items.length === 0) {
      functions.logger.error("Document de paiement incomplet ou sans items.", { data: paymentData });
      return null;
    }

    try {
      // Récupérer le premier article (on suppose un seul pack par achat)
      const priceId = paymentData.items[0].price.id;
      if (!priceId) {
        functions.logger.error("ID de prix manquant dans l'item de paiement.");
        return null;
      }

      // Récupérer l'objet Price complet depuis l'API Stripe
      const price = await stripe.prices.retrieve(priceId, {
        expand: ['product'], // Important: pour récupérer les métadonnées du produit associé
      });

      // L'objet Product est maintenant disponible
      const product = price.product as Stripe.Product;

      if (!product || !product.metadata) {
        functions.logger.error("Produit ou métadonnées du produit introuvables.", { productId: price.product });
        return null;
      }

      const { metadata } = product;
      functions.logger.info("Métadonnées du produit récupérées :", metadata);

      const userRef = admin.firestore().collection('users').doc(userId);
      const updates: { [key: string]: admin.firestore.FieldValue } = {};

      // Vérifier quelle métadonnée est présente et préparer l'incrémentation
      if (metadata.packUploadTickets && Number(metadata.packUploadTickets) > 0) {
        updates.packUploadTickets = admin.firestore.FieldValue.increment(Number(metadata.packUploadTickets));
        functions.logger.info(`Crédit de ${metadata.packUploadTickets} tickets d'upload pour l'utilisateur ${userId}.`);
      } else if (metadata.packAiTickets && Number(metadata.packAiTickets) > 0) {
        updates.packAiTickets = admin.firestore.FieldValue.increment(Number(metadata.packAiTickets));
        functions.logger.info(`Crédit de ${metadata.packAiTickets} tickets IA pour l'utilisateur ${userId}.`);
      } else {
        functions.logger.warn("Aucune métadonnée de ticket trouvée sur le produit.", { metadata });
        return null;
      }
      
      // Appliquer la mise à jour sur le document de l'utilisateur
      await userRef.update(updates);
      functions.logger.info(`Profil de l'utilisateur ${userId} mis à jour avec succès.`);
      
      return { success: true, userId, updates };

    } catch (error) {
      functions.logger.error("Erreur lors du traitement du paiement et du crédit des tickets :", error);
      return { success: false, error: (error as Error).message };
    }
  });

