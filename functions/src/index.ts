
'use server';

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { buffer } from "micro";

// Initialiser Firebase Admin SDK une seule fois
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Tenter de récupérer les clés et préparer un indicateur d'erreur
let stripeSecretKey, webhookSecret;
let configError = false;

try {
  stripeSecretKey = functions.config().stripe.secret_key;
  webhookSecret = functions.config().stripe.webhook_secret;
  if (!stripeSecretKey || !webhookSecret) {
    functions.logger.error("Erreur critique de configuration : Les variables 'stripe.secret_key' ou 'stripe.webhook_secret' sont manquantes dans la configuration des fonctions Firebase.");
    configError = true;
  }
} catch (e) {
  functions.logger.error("Erreur critique : Le groupe de configuration 'stripe' est manquant. Exécutez 'firebase functions:config:set stripe.secret_key=...' et 'stripe.webhook_secret=...'.", e);
  configError = true;
}


const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: "2024-06-20",
});

/**
 * Webhook unique et robuste qui écoute les événements de Stripe.
 * C'est le point d'entrée pour toutes les confirmations de paiement.
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Si les clés ne sont pas configurées, on arrête tout de suite.
  if (configError) {
    return res.status(500).send("Erreur de configuration du serveur. Les clés Stripe ne sont pas définies.");
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    functions.logger.error("Aucune signature Stripe trouvée dans l'en-tête.");
    return res.status(400).send('Webhook Error: No signature provided.');
  }

  const reqBuffer = await buffer(req);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(reqBuffer, sig, webhookSecret);
    functions.logger.log(`Événement Stripe reçu et validé : ${event.type}`);
  } catch (err: any) {
    functions.logger.error("Erreur de vérification de la signature du webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.payment_status === 'paid') {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
        if (!lineItems.data.length || !lineItems.data[0].price || !lineItems.data[0].price.product) {
            functions.logger.error("Impossible de récupérer les 'line items' ou le produit de la session.", { session_id: session.id });
            return res.status(400).send("Données de la commande invalides.");
        }

        const product = await stripe.products.retrieve(lineItems.data[0].price.product as string);
        const metadata = product.metadata;
        const userId = session.client_reference_id;

        if (!userId) {
          functions.logger.error("Aucun client_reference_id (userId) trouvé dans la session Stripe.", { session_id: session.id });
          return res.status(400).send("User ID manquant dans la session.");
        }

        const userDocRef = admin.firestore().doc(`users/${userId}`);
        const updates: { [key: string]: any } = {};

        // S'assurer que le customer ID est bien enregistré
        if (session.customer) {
            updates.stripeCustomerId = session.customer;
        }

        if (metadata.packUploadTickets) {
          updates.packUploadTickets = admin.firestore.FieldValue.increment(parseInt(metadata.packUploadTickets, 10));
        }
        if (metadata.packAiTickets) {
          updates.packAiTickets = admin.firestore.FieldValue.increment(parseInt(metadata.packAiTickets, 10));
        }

        if (Object.keys(updates).length > 1 || (Object.keys(updates).length === 1 && updates.stripeCustomerId)) {
          await userDocRef.update(updates);
          functions.logger.log(`SUCCÈS : Utilisateur ${userId} crédité avec succès.`, { updates });
        } else {
          functions.logger.warn("Aucune métadonnée de crédit de ticket trouvée pour ce produit, ou aucun customerId à mettre à jour.", { productId: product.id });
        }

      } catch (error: any) {
        functions.logger.error(`Erreur lors du traitement de la session ${session.id}:`, error);
        return res.status(500).send(`Internal Server Error: ${error.message}`);
      }
    }
  }

  return res.status(200).send({ received: true });
});
