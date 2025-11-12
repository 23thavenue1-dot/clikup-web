
'use server';

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Initialiser Firebase Admin SDK une seule fois
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Pas besoin des clés ici car nous ne vérifions plus le webhook nous-mêmes.
const stripeSecretKey = functions.config().stripe.secret_key;
if (!stripeSecretKey) {
  console.error("Erreur critique : La clé secrète Stripe (secret_key) n'est pas configurée.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

/**
 * Fonction qui se déclenche lorsqu'un document de paiement est créé par l'extension Stripe.
 * C'est le NOUVEAU mécanisme pour créditer les tickets.
 */
exports.creditTicketsOnPayment = functions.firestore
  .document("customers/{userId}/payments/{paymentId}")
  .onCreate(async (snapshot, context) => {
    const paymentData = snapshot.data();
    const userId = context.params.userId;

    functions.logger.log(`Déclenchement de creditTicketsOnPayment pour l'utilisateur ${userId}`, { paymentId: context.params.paymentId });

    if (!paymentData || !paymentData.items || paymentData.items.length === 0) {
      functions.logger.warn("Document de paiement sans items, arrêt du traitement.");
      return;
    }

    try {
      const userDocRef = admin.firestore().doc(`users/${userId}`);
      const product = await stripe.products.retrieve(paymentData.items[0].price.product);
      const metadata = product.metadata;

      functions.logger.log(`Traitement de la commande pour le produit ${product.id}`, { metadata });

      const updates: { [key: string]: admin.firestore.FieldValue } = {};

      if (metadata.packUploadTickets) {
        updates.packUploadTickets = admin.firestore.FieldValue.increment(parseInt(metadata.packUploadTickets, 10));
      }
      if (metadata.packAiTickets) {
        updates.packAiTickets = admin.firestore.FieldValue.increment(parseInt(metadata.packAiTickets, 10));
      }

      if (Object.keys(updates).length > 0) {
        await userDocRef.update(updates);
        functions.logger.log(`SUCCÈS : Utilisateur ${userId} crédité avec succès.`, { updates });
      } else {
        functions.logger.log("Aucune métadonnée de crédit de ticket trouvée sur ce produit.", { productId: product.id });
      }
    } catch (error) {
      functions.logger.error(`Erreur lors du crédit des tickets pour l'utilisateur ${userId}:`, error);
      // Ne rien retourner pour éviter que la fonction ne soit réessayée indéfiniment pour une erreur logique.
    }
  });


/**
 * Cloud Function (déclenchée par Firestore) qui synchronise le stripeCustomerId.
 * Se déclenche quand un checkout_session est créé.
 */
exports.syncStripeCustomerId = functions.firestore
  .document("customers/{userId}/checkout_sessions/{sessionId}")
  .onCreate(async (snapshot, context) => {
    const userId = context.params.userId;
    functions.logger.log(`Déclenchement de syncStripeCustomerId pour l'utilisateur ${userId}`);

    for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            const sessionDoc = await snapshot.ref.get();
            const sessionData = sessionDoc.data();

            if (sessionData?.customer) {
                const userDocRef = admin.firestore().doc(`users/${userId}`);
                // Vérifier si l'ID client a déjà été défini pour éviter les écritures inutiles
                const userSnap = await userDocRef.get();
                if (userSnap.exists() && userSnap.data()?.stripeCustomerId !== sessionData.customer) {
                    await userDocRef.update({ stripeCustomerId: sessionData.customer });
                    functions.logger.log(`SUCCÈS : Stripe Customer ID ${sessionData.customer} synchronisé pour l'utilisateur ${userId}.`);
                } else {
                    functions.logger.log(`Info : Stripe Customer ID déjà synchronisé pour l'utilisateur ${userId}.`);
                }
                return;
            }
            
            if (sessionData?.error) {
                functions.logger.error(`ERREUR : La création de la session Stripe a échoué pour l'utilisateur ${userId}.`, sessionData.error);
                return;
            }

            functions.logger.warn(`Essai ${i + 1}/5 : Customer ID non trouvé pour l'utilisateur ${userId}. Nouvel essai...`);

        } catch (error) {
            functions.logger.error(`ERREUR lors de la tentative de synchronisation pour l'utilisateur ${userId}:`, error);
            return;
        }
    }

    functions.logger.error(`ÉCHEC FINAL : Customer ID non trouvé après 5 essais pour l'utilisateur ${userId}.`);
  });

// L'ancien webhook est maintenant obsolète et a été supprimé.
// La logique est gérée par la nouvelle fonction creditTicketsOnPayment.
