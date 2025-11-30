# Journal de Dépannage : Fonctionnalité Planificateur

Ce document est dédié au suivi de la résolution du problème empêchant la sauvegarde et la programmation de publications depuis l'interface de génération IA.

---

### Problème Initial

- **Symptôme :** L'application génère une erreur lors d'un clic sur "Enregistrer en brouillon" ou "Programmer..." sur la page `/audit/resultats/[auditId]`.
- **Date :** Constaté après l'implémentation initiale des boutons.

---

### Analyse et Tentatives

#### Hypothèse 1 : Erreur de Référence Firestore (Corrigé mais insuffisant)

- **Diagnostic :** La fonction `savePostForLater` dans `src/lib/firestore.ts` tentait d'écrire dans la base de données en utilisant un simple chemin (`string`) au lieu d'une `CollectionReference` valide.
- **Action :** Modification de `savePostForLater` pour qu'elle utilise `collection(firestore, ...)` afin de créer une référence correcte.
- **Résultat :** L'erreur a changé, indiquant que le problème était plus profond.

#### Hypothèse 2 : Instance de Storage manquante (Corrigé mais insuffisant)

- **Diagnostic :** L'instance `storage` était `undefined` lors de l'appel à `savePostForLater`. Le hook `useStorage()` était utilisé dans la page, mais il n'existait pas.
- **Action corrective :** Remplacement de `useStorage` par le hook principal `useFirebase` qui fournit l'ensemble des services, y compris `storage`.
- **Résultat :** Le problème a évolué vers une erreur de permission `storage/unauthorized`.

#### Hypothèse 3 et 4 : Erreurs successives sur les règles Storage (Piste abandonnée)

- **Diagnostic :** L'erreur persistante `storage/unauthorized` indiquait un problème avec le fichier `storage.rules`. Plusieurs tentatives de restructuration des règles ont été effectuées.
- **Action corrective :** Simplification et explicitation des règles dans `storage.rules`.
- **Résultat :** Échec. L'erreur `storage/unauthorized` a disparu, mais a été remplacée par une erreur `firestore.rules` (Missing or insufficient permissions), indiquant que mon diagnostic était erroné et que le problème se situait ailleurs.

#### Hypothèse 5 : Absence de règles Firestore (LA VRAIE CAUSE RACINE)

- **Diagnostic final :** Le nouveau message d'erreur `Missing or insufficient permissions` pointait sans ambiguïté vers le fichier `firestore.rules`. En analysant la requête (`create` sur `/users/{userId}/scheduledPosts`), il est devenu évident qu'il n'y avait **aucune règle `match`** pour la sous-collection `scheduledPosts`.
- **Action corrective finale :** Ajouter un bloc `match /scheduledPosts/{postId}` dans `firestore.rules` pour autoriser explicitement les opérations de lecture et d'écriture (`create`, `update`, `delete`) pour les utilisateurs authentifiés sur leurs propres documents.
- **Résultat :** En attente de validation après application de la correction.
