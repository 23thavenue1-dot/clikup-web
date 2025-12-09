
# Journal de Bord : Intégration et Débogage des Paiements Stripe

Ce document sert de journal de bord pour l'intégration de la fonctionnalité de paiement avec Stripe. Il retrace de manière chronologique les problèmes rencontrés, les hypothèses émises et les solutions apportées pour aboutir à un système fonctionnel.

---

### **Étape 1 : Initialisation et Première Erreur ("No such price")**

*   **Objectif :** Rendre les boutons d'achat de la boutique fonctionnels.
*   **Problème Rencontré :** L'utilisateur était redirigé vers une page d'erreur Stripe indiquant `No such price: 'price_...'`.
*   **Diagnostic :** L'application utilisait des ID de prix fictifs.
*   **Solution Apportée :** Remplacer les ID fictifs par les ID de prix réels créés dans le tableau de bord Stripe en mode test.
*   **Résultat :** La première erreur a été résolue, prouvant la communication de base avec Stripe.

---

### **Étape 2 : Le Mystère de la Page Blanche**

*   **Objectif :** Afficher la page de paiement Stripe après un clic.
*   **Problème Rencontré :** Redirection vers une page blanche au lieu de la page de paiement Stripe.
*   **Diagnostic Final et Solution :**
    *   **La découverte clé :** L'accès à l'application ne se faisait pas via l'URL officielle fournie par l'environnement de développement, mais via `localhost`.
    *   **L'explication :** Les redirections complexes et les webhooks de Stripe ne peuvent fonctionner correctement que si l'on utilise **l'URL d'accès publique et sécurisée** de l'environnement de développement.
*   **Résultat :** En utilisant la bonne URL, le cycle de paiement est devenu 100% fonctionnel en mode test.

---

### **Étape 3 : La "Livraison" des Tickets - Le Problème du Crédit Post-Achat**

*   **Objectif :** S'assurer que les tickets achetés sont bien ajoutés au compte de l'utilisateur.
*   **Problème Rencontré :** Après un paiement validé, le solde de tickets de l'utilisateur n'était pas mis à jour.
*   **Diagnostic Final (l'idée de l'utilisateur) :**
    *   **L'observation :** Les tentatives de récupération des informations post-paiement via des Cloud Functions étaient complexes et peu fiables.
    *   **L'idée brillante :** Pourquoi redemander à Stripe une information que l'on possède déjà au moment du clic ? Passer directement le nombre de tickets à créditer lors de la création de la session de paiement.
    *   **La confirmation :** L'extension `firestore-stripe-payments` copie automatiquement les `metadata` de la session de paiement vers le document de paiement final dans Firestore.
*   **Solution Apportée (LA BONNE) :**
    1.  **Modification Côté Client (`shop/page.tsx`) :** Ajout d'un champ `metadata` lors de la création de la session de paiement, contenant directement le nombre de tickets à créditer (ex: `{ packUploadTickets: 120 }`).
    2.  **Simplification Radicale Côté Serveur (`functions/src/index.js`) :** La Cloud Function `onPaymentSuccess` est réécrite pour ne plus contacter Stripe. Elle lit simplement le champ `metadata` du document de paiement et met à jour le profil utilisateur.
*   **Résultat :** **SUCCÈS TOTAL.** Le système est devenu plus simple, plus rapide et plus fiable.

---

### **Étape 4 : Le Portail Client et la Gestion d'Abonnement**

*   **Objectif :** Faire fonctionner le bouton "Gérer mon abonnement".
*   **Problème Rencontré :** Une erreur `internal` persistait lors de l'appel à la fonction Cloud `createPortalLink`.
*   **Diagnostic Final (LA PERCÉE DE L'UTILISATEUR) :**
    *   **L'observation :** Le code client appelait une fonction avec un nom (`ext-invertase-firestore-stripe-payments-createPortalLink`) correspondant à une ancienne version de l'extension.
    *   **La déduction :** Le nom correct de la fonction pour la nouvelle extension était `ext-firestore-stripe-payments-createPortalLink`.
*   **Solution Apportée :**
    1.  **Correction du nom de la fonction (`settings/page.tsx`) :** Le nom de la fonction `httpsCallable` a été corrigé pour correspondre exactement au nom de la fonction déployée par l'extension.
*   **Résultat :** **SUCCÈS IMMÉDIAT.** Le bouton a fonctionné du premier coup.

---

### **Étape 5 : Passage en Production (Mode "Live")**

*   **Objectif :** Accepter de vrais paiements.
*   **Problème Rencontré :** Après avoir basculé les clés Stripe en mode "Live", une erreur `No such customer: 'cus_...'` apparaît, car l'ID client de l'utilisateur correspondait à un client du mode "Test" qui n'existe pas en "Live".
*   **Solution Apportée :**
    1.  **Ajout d'un Bouton de Réinitialisation :** Un bouton "Réinitialiser Stripe" a été ajouté dans la "Zone de danger" des paramètres du compte.
    2.  **Logique de Réinitialisation :** Au clic, ce bouton efface le champ `stripeCustomerId` du document de l'utilisateur dans Firestore.
    3.  **Correction du Flux :** Lors de la prochaine tentative d'achat, comme le `stripeCustomerId` est nul, l'extension Stripe crée automatiquement un nouveau client en mode "Live", résolvant l'erreur.
*   **Résultat :** Le passage de l'environnement de test à la production est maintenant fluide et gérable par l'utilisateur.
