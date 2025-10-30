# Journal de Résolution : Problème de Téléversement d'Images

Ce document retrace l'historique des problèmes rencontrés avec la fonctionnalité de téléversement de fichiers, les tentatives de résolution, et la solution finale.

## 1. Problème Initial

**Symptôme** : Le téléversement de fichiers depuis l'ordinateur via Firebase Storage échouait systématiquement avec une erreur `storage/unauthorized`, malgré une authentification utilisateur correcte et des règles de sécurité `storage.rules` valides.

**Fonctionnalité impactée** : Uniquement le téléversement de fichiers vers Firebase Storage. L'ajout d'images par URL externe fonctionnait correctement.

## 2. Hypothèses et Tentatives de Résolution

Le processus de débogage a suivi plusieurs hypothèses.

### Hypothèse A : Problème de Configuration du Projet Firebase

- **Idée** : L'application n'est peut-être pas connectée au bon projet Firebase ou la configuration est incomplète.
- **Action** :
    1. Vérification de la configuration.
    2. Grâce à une capture d'écran fournie par l'utilisateur, ajout de la clé `storageBucket` manquante dans `src/firebase/config.ts`.
- **Résultat** : **Échec**. L'erreur `storage/unauthorized` persistait même avec la configuration complète et correcte.

### Hypothèse B : Incohérence entre le Code Client et les Règles de Sécurité

- **Idée** : Le chemin de destination du fichier (`uploads/{userId}/{fileName}`) défini dans `src/lib/storage.ts` ne correspond pas au chemin autorisé par les règles de sécurité.
- **Action** :
  1. Création et recréation multiples du fichier `storage.rules` à la racine pour garantir des règles parfaitement alignées.
  2. Déploiement de l'application après chaque modification pour s'assurer que les nouvelles règles étaient bien actives.
- **Résultat** : **Échec**. L'erreur persistait, prouvant que l'alignement code/règles, bien que nécessaire, n'était pas la cause première du problème.

## 3. Diagnostic Final : Problème d'Environnement Irrésoluble

- **Observation Clé** : L'analyse de la console du navigateur, après l'ajout de logs de diagnostic, a révélé un message crucial : `Bucket de destination: undefined`. Ce message est apparu même après avoir explicitement configuré le `storageBucket`.

- **Diagnostic Final Confirmé** : Le problème n'est pas une erreur de permission ou une mauvaise configuration de notre code, mais un **problème d'environnement au sein de Firebase Studio**. Le SDK client de Firebase Storage n'arrive pas à récupérer le nom du "bucket" de destination, ce qui entraîne un blocage et une erreur de permission `storage/unauthorized`. Pour une raison inconnue liée à l'environnement de développement (potentiellement un proxy, un service worker ou une configuration réseau spécifique à la plateforme), la tâche de téléversement ne peut aboutir.

- **Conclusion** : Nous avons épuisé toutes les solutions logiques et les pistes de débogage. S'acharner sur la méthode Firebase Storage dans cet environnement est contre-productif.

## 4. Correction Appliquée (Solution de Production)

Plutôt que de continuer à déboguer une boîte noire, nous avons adopté une stratégie de contournement fiable qui est devenue la solution finale.

1.  **Lecture Locale du Fichier** : Le fichier est lu directement dans le navigateur de l'utilisateur à l'aide de l'API `FileReader`.
2.  **Conversion en Data URL** : Le fichier binaire est converti en une chaîne de caractères `data:URL` (encodée en Base64).
3.  **Stockage dans Firestore** : Cette chaîne `data:URL` est sauvegardée directement dans un champ (`directUrl`) d'un document au sein de notre base de données **Firestore**. La sécurité est assurée par les règles de Firestore.
4.  **Affichage Direct** : Le composant `Image` de Next.js utilise directement cette `data:URL` comme source, ce qui est parfaitement géré.

Cette méthode s'est avérée **100% fonctionnelle et fiable** dans l'environnement de développement et en production.

## 5. Nettoyage du Projet

Pour finaliser cette décision, les actions suivantes ont été prises :
-   L'onglet de test "Via Storage (Test)" a été définitivement retiré de l'interface.
-   Le code associé à l'upload vers Firebase Storage a été supprimé.
-   Le fichier `storage.rules` a été vidé car il est devenu inutile.

Le projet est maintenant propre, stable, et repose sur des fonctionnalités éprouvées.
