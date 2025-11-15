"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();

const db = admin.firestore();

// La clé secrète Stripe doit être configurée dans les variables d'environnement des fonctions.
// C'est cette ligne qui va chercher la configuration que vous allez définir.
const stripeSecret = functions.config().stripe?.secret;
if (!stripeSecret) {
    console.error("La clé secrète Stripe n'est pas configurée ! Exécutez 'firebase functions:config:set stripe.secret=VOTRE_CLÉ'.");
}
const stripe = new Stripe(stripeSecret || '', {
  apiVersion: "2024-06-20",
});

// --- VERSION GEN 1 ---
// C'est une version plus ancienne mais beaucoup plus stable de l'API des fonctions.
exports.onPaymentSuccess = functions
  .region("us-central1")
  .firestore
  .document("customers/{userId}/payments/{paymentId}")
  .onCreate(async (snap, context) => {
    const payment = snap.data();
    const { userId, paymentId } = context.params;
    functions.logger.info(
      `Déclenchement pour l'utilisateur ${userId}, paiement ${paymentId}`
    );

    if (!payment || !payment.items || payment.items.length === 0) {
      functions.logger.error(
        "Le document de paiement ne contient pas d'articles ('items').",
        { paymentData: payment }
      );
      return;
    }

    const userRef = db.doc(`users/${userId}`);
    const updates = {};

    try {
      for (const item of payment.items) {
        // La correction est ici. L'ID du produit est une chaîne, pas un objet.
        if (item.price && typeof item.price.product === 'string') {
          const productId = item.price.product;
          const product = await stripe.products.retrieve(productId);

          functions.logger.info(
            `Produit récupéré depuis Stripe : ${product.name}`,
            { metadata: product.metadata }
          );

          if (
            product.metadata &&
            product.metadata.packUploadTickets &&
            Number(product.metadata.packUploadTickets) > 0
          ) {
            updates.packUploadTickets = admin.firestore.FieldValue.increment(
              Number(product.metadata.packUploadTickets)
            );
          }

          if (
            product.metadata &&
            product.metadata.packAiTickets &&
            Number(product.metadata.packAiTickets) > 0
          ) {
            updates.packAiTickets = admin.firestore.FieldValue.increment(
              Number(product.metadata.packAiTickets)
            );
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await userRef.set(updates, { merge: true });
        functions.logger.info(
          `Succès ! Tickets crédités pour l'utilisateur ${userId}.`,
          { updates }
        );
      } else {
        functions.logger.warn(
          "Aucune métadonnée de ticket trouvée sur les produits achetés."
        );
      }
    } catch (error) {
      functions.logger.error(
        `Erreur lors du traitement du paiement pour l'utilisateur ${userId}:`,
        error
      );
    }
  });
