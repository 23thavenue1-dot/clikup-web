# Journal de Développement : Fonctionnalité de Téléversement d'Images

Ce document suit l'évolution, les décisions et les problèmes rencontrés lors de la création de la fonctionnalité de téléversement d'images.

## 1. Objectif Initial

L'objectif est de permettre aux utilisateurs de téléverser des images dans leur galerie personnelle de manière simple et fiable. La méthode privilégiée est l'utilisation de Firebase Storage pour une meilleure performance et gestion des fichiers.

## 2. Problème Rencontré : Blocage avec Firebase Storage

Lors des tentatives d'implémentation de l'upload direct vers Firebase Storage, nous avons rencontré une erreur persistante et bloquante : `storage/unauthorized`.

- **Symptôme** : Malgré une authentification utilisateur correcte et des règles de sécurité (`storage.rules`) a priori valides, le serveur Firebase refusait systématiquement le téléversement.
- **Diagnostic** : Après de multiples tests, incluant l'ajout de logs détaillés, nous avons découvert que l'environnement d'exécution de Firebase Studio ne parvenait pas à déterminer le "bucket" de destination (`Bucket de destination: undefined`). Le problème ne venait donc pas de notre code ou de nos règles, mais d'une spécificité de l'environnement.

## 3. Solution de Contournement et Stratégie Actuelle

Pour ne pas rester bloqué et disposer d'une fonctionnalité d'upload 100% fonctionnelle, nous avons mis en place une double stratégie :

### Stratégie A : Le Contournement Fiable

- **Méthode** : Nous avons développé une méthode d'upload qui contourne Firebase Storage. L'image est lue par le navigateur, convertie en `Data URL` (une longue chaîne de texte), et cette chaîne est sauvegardée directement dans notre base de données Firestore.
- **Statut** : **Fonctionnel et fiable**. C'est notre méthode de production "sécurisée".

### Stratégie B : L'Isolation pour le Débogage

- **Méthode** : Pour continuer à investiguer le problème initial sans impacter l'application, nous avons décidé de créer une interface à onglets.
- **État des lieux** :
    1. **Onglet "Via Fichier (sécurisé)"**: Utilise la méthode de contournement (Data URL). **Opérationnel.**
    2. **Onglet "Via URL"**: Permet d'ajouter une image depuis un lien externe. **Opérationnel.**
    3. **Onglet "Via Storage (Test)"**: C'est ici que nous avons isolé la méthode d'upload originale via Firebase Storage. C'est notre "laboratoire" pour résoudre le problème. **Actuellement en échec (`storage/unauthorized`).**

## 4. Prochaines Étapes

L'objectif est de rendre l'onglet "Via Storage (Test)" fonctionnel.

- **Action en cours** : Nous avons recréé un fichier `storage.rules` propre et complet à la racine du projet pour être absolument certains que les bonnes règles sont déployées.
- **Étape suivante** : Publier l'application pour déployer ces nouvelles règles et tester à nouveau l'upload via l'onglet de test.
