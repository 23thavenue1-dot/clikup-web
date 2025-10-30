# Journal de Développement : Fonctionnalité de Téléversement d'Images

Ce document suit l'évolution, les décisions et les leçons apprises lors de la création de la fonctionnalité de téléversement d'images.

## 1. Objectif Initial

L'objectif était de permettre aux utilisateurs de téléverser des images dans leur galerie personnelle en utilisant la méthode recommandée, Firebase Storage, pour sa robustesse et sa performance.

## 2. Le Défi : `storage/unauthorized`

Dès le début, nous avons fait face à une erreur persistante et bloquante : `storage/unauthorized`. Malgré une authentification correcte et des règles de sécurité valides, Firebase refusait le téléversement.

Le débogage a été un processus en plusieurs étapes :

1.  **Première Piste : La Configuration** : Grâce à une collaboration efficace, nous avons découvert via une capture d'écran que la clé `storageBucket` manquait dans la configuration Firebase de l'application. Son ajout a été une étape cruciale.

2.  **Seconde Piste : Le Chemin d'Accès** : Malgré la correction de la configuration, l'erreur persistait. Une analyse plus approfondie, aidée par les règles `storage.rules` fournies par l'utilisateur, a révélé une incohérence : le code tentait d'écrire dans un dossier `uploads/` alors que les règles sécurisaient un dossier `users/`.

## 3. La Solution : Alignement et Succès

La solution finale a consisté à corriger ces deux points :
- Assurer une configuration Firebase complète dans `src/firebase/config.ts`.
- Modifier le code dans `src/lib/storage.ts` pour qu'il cible le bon chemin de stockage (`users/{userId}/...`).

Avec ces corrections, la fonctionnalité de téléversement via Firebase Storage est devenue **100% fonctionnelle et fiable**.

## 4. Stratégie Multi-Upload

L'application propose désormais plusieurs méthodes d'upload pour une flexibilité maximale :

1.  **Via Fichier (Data URL)** : Une méthode alternative et robuste où le fichier est converti en texte et stocké dans Firestore.
2.  **Via URL** : Permet d'ajouter une image depuis un lien externe.
3.  **Via Storage** : La méthode standard et performante utilisant Firebase Storage, maintenant pleinement opérationnelle.

## 5. Prochaines Étapes

Maintenant que la base est solide et fonctionnelle, nous pouvons nous concentrer sur l'amélioration de l'expérience utilisateur et l'ajout de nouvelles fonctionnalités, comme celles envisagées dans `docs/idées.md`.
