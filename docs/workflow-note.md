# Journal de Dépannage : Fonctionnalité Planificateur

Ce document est dédié au suivi de la résolution du problème empêchant la sauvegarde et la programmation de publications depuis l'interface de génération IA.

---

### Problème Initial

- **Symptôme :** L'application génère une erreur `Cannot read properties of undefined (reading 'path')` lors d'un clic sur "Enregistrer en brouillon" ou "Programmer..." sur la page `/audit/resultats/[auditId]`.
- **Date :** Constaté après l'implémentation initiale des boutons.

---

### Analyse et Tentatives

#### Hypothèse 1 : Erreur de Référence Firestore (Corrigé mais insuffisant)

- **Diagnostic :** La fonction `savePostForLater` dans `src/lib/firestore.ts` tentait d'écrire dans la base de données en utilisant un simple chemin (`string`) au lieu d'une `CollectionReference` valide.
- **Action :** Modification de `savePostForLater` pour qu'elle utilise `collection(firestore, ...)` afin de créer une référence correcte.
- **Résultat :** L'erreur a changé, indiquant que le problème était plus profond.

#### Hypothèse 2 : Instance de Storage manquante (En cours)

- **Diagnostic :** La nouvelle erreur indique que l'instance `storage` elle-même est `undefined` au moment où la fonction `savePostForLater` est appelée depuis la page des résultats de l'audit. En examinant `src/app/audit/resultats/[auditId]/page.tsx`, on s'aperçoit que le code tente d'utiliser un hook `useStorage()` qui n'existe pas.
- **Action corrective :** Remplacer `useStorage` par le hook principal `useFirebase` qui fournit l'ensemble des services, y compris `storage`.
- **Prochaine étape :** Vérifier si cette correction résout l'erreur et permet à la fonction de sauvegarde de s'exécuter correctement.

---
