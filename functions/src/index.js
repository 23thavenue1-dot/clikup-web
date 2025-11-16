"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.onPaymentSuccess = functions
  .region("us-central1")
  .firestore.document("customers/{userId}/payments/{paymentId}")
  .onCreate(async (snap, context) => {
    const payment = snap.data();
    const { userId } = context.params;

    functions.logger.info(
      `Déclenchement pour l'utilisateur ${userId}.`,
      { paymentData: payment }
    );

    const meta = payment.metadata || {};
    const uploadTickets = Number(meta.packUploadTickets || 0);
    const aiTickets = Number(meta.packAiTickets || 0);
    const subscriptionTier = meta.subscriptionTier || null;

    if (!uploadTickets && !aiTickets && !subscriptionTier) {
      functions.logger.warn(
        "Aucune métadonnée exploitable (tickets ou abonnement) trouvée.",
        { metadata: meta }
      );
      return;
    }

    const userRef = db.doc(`users/${userId}`);
    const updates = {};

    // Gérer l'ajout de tickets via les packs
    if (uploadTickets > 0) {
      updates.packUploadTickets = admin.firestore.FieldValue.increment(
        uploadTickets
      );
    }
    if (aiTickets > 0) {
      updates.packAiTickets = admin.firestore.FieldValue.increment(aiTickets);
    }
    
    // Gérer le changement de statut d'abonnement
    if (subscriptionTier) {
        updates.subscriptionTier = subscriptionTier;
        // Ici, on pourrait ajouter une logique pour définir la date de renouvellement, etc.
        // Pour l'instant, on active simplement le niveau.
    }

    try {
      await userRef.set(updates, { merge: true });
      functions.logger.info(
        `Succès ! Profil mis à jour pour l'utilisateur ${userId}.`,
        { updates }
      );
    } catch (error) {
      functions.logger.error(
        `Erreur lors de la mise à jour du profil pour l'utilisateur ${userId}:`,
        error
      );
    }
  });
