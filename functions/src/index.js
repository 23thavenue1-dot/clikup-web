
"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Fonction Cloud qui se déclenche lors de la création d'un paiement unique (pack de tickets).
 * Elle crédite les tickets achetés sur le profil de l'utilisateur.
 */
exports.onPaymentSuccess = functions
  .region("us-central1")
  .firestore.document("customers/{userId}/payments/{paymentId}")
  .onCreate(async (snap, context) => {
    const payment = snap.data();
    const { userId } = context.params;

    functions.logger.info(
      `Déclenchement PAIEMENT pour l'utilisateur ${userId}.`,
      { paymentData: payment }
    );

    // Les métadonnées sont maintenant directement sur l'objet 'payment'
    const meta = payment.metadata || {}; 
    const uploadTickets = Number(meta.packUploadTickets || 0);
    const aiTickets = Number(meta.packAiTickets || 0);

    if (!uploadTickets && !aiTickets) {
      functions.logger.warn(
        "Paiement sans métadonnées de tickets de pack, on ignore.",
        { metadata: meta }
      );
      return;
    }

    const userRef = db.doc(`users/${userId}`);
    const updates = {};

    if (uploadTickets > 0) {
      updates.packUploadTickets = admin.firestore.FieldValue.increment(uploadTickets);
    }
    if (aiTickets > 0) {
      updates.packAiTickets = admin.firestore.FieldValue.increment(aiTickets);
    }

    try {
      await userRef.set(updates, { merge: true });
      functions.logger.info(
        `Succès PAIEMENT ! Profil mis à jour pour ${userId}.`,
        { updates }
      );
    } catch (error) {
      functions.logger.error(
        `Erreur PAIEMENT lors de la mise à jour du profil pour ${userId}:`,
        error
      );
    }
  });


/**
 * Nouvelle fonction Cloud qui se déclenche lors d'un changement sur un abonnement.
 * Elle met à jour le statut de l'abonnement et les quotas de tickets sur le profil utilisateur.
 */
exports.onSubscriptionChange = functions
  .region("us-central1")
  .firestore.document("customers/{userId}/subscriptions/{subId}")
  .onWrite(async (change, context) => {
    const { userId } = context.params;
    const afterData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;

    functions.logger.info(`Déclenchement ABONNEMENT pour l'utilisateur ${userId}.`, { afterData });

    const userRef = db.doc(`users/${userId}`);

    // --- CAS 1: L'abonnement devient ACTIF (nouvel abonnement ou réactivation) ---
    if (afterData && afterData.status === "active" && (!beforeData || beforeData.status !== "active")) {
      // Les métadonnées sont dans le premier item de la liste des prix
      const priceMetadata = afterData.items?.[0]?.price?.metadata || {};
      const tier = priceMetadata.subscriptionTier || 'none';
      
      const uploadTickets = priceMetadata.monthlyUploadTickets === 'unlimited' ? 999999 : Number(priceMetadata.monthlyUploadTickets || 0);
      const aiTickets = Number(priceMetadata.monthlyAiTickets || 0);

      const updates = {
          subscriptionTier: tier,
          subscriptionUploadTickets: uploadTickets,
          subscriptionAiTickets: aiTickets,
          subscriptionRenewalDate: afterData.current_period_end // timestamp
      };

      try {
          await userRef.set(updates, { merge: true });
          functions.logger.info(`Succès ABONNEMENT ! Plan '${tier}' activé pour ${userId}.`, { updates });
      } catch (error) {
          functions.logger.error(`Erreur ABONNEMENT lors de l'activation pour ${userId}:`, error);
      }
      return;
    }

    // --- CAS 2: L'abonnement est ANNULÉ ou EXPIRÉ ---
    if (afterData && (afterData.status === "canceled" || afterData.status === "past_due" || afterData.status === "unpaid")) {
       const updates = {
          subscriptionTier: 'none',
          subscriptionUploadTickets: 0,
          subscriptionAiTickets: 0,
          subscriptionRenewalDate: null
       };
        try {
          await userRef.set(updates, { merge: true });
          functions.logger.info(`Abonnement désactivé pour ${userId}.`, { status: afterData.status });
        } catch (error) {
           functions.logger.error(`Erreur lors de la désactivation de l'abonnement pour ${userId}:`, error);
        }
        return;
    }
    
    // --- CAS 3: L'abonnement est SUPPRIMÉ ---
    if (!afterData) {
       const updates = {
          subscriptionTier: 'none',
          subscriptionUploadTickets: 0,
          subscriptionAiTickets: 0,
          subscriptionRenewalDate: null
       };
        try {
          await userRef.set(updates, { merge: true });
          functions.logger.info(`Abonnement supprimé pour ${userId}.`);
        } catch (error) {
           functions.logger.error(`Erreur lors de la suppression de l'abonnement pour ${userId}:`, error);
        }
        return;
    }

  });

    