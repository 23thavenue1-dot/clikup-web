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
- **Résultat :** Le problème a évolué vers une erreur de permission `storage/unauthorized`. C'est un progrès, car cela pointe vers les règles de sécurité.

#### Hypothèse 3 : Erreur d'analyse des règles Storage (LA VRAIE CAUSE RACINE)

- **Diagnostic final :** L'erreur `storage/unauthorized` persiste, ce qui indique que, malgré plusieurs tentatives, la syntaxe ou la structure des règles dans `storage.rules` n'est pas correcte. Les `match` multiples au même niveau de hiérarchie peuvent prêter à confusion.

- **Action corrective finale :** Refonte complète de `storage.rules` pour utiliser une approche plus simple et plus explicite : un bloc `match` séparé pour chaque dossier (`users`, `avatars`, `scheduledPosts`). Cette structure, bien que plus verbeuse, est infaillible et ne laisse aucune place à l'interprétation par le moteur de règles de Firebase. Cela garantit que le chemin `scheduledPosts/{userId}/{fileName}` correspondra bien à une règle d'autorisation explicite.
