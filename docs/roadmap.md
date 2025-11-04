# Feuille de Route de "Clikup"

Ce document trace les grandes lignes des fonctionnalités que nous prévoyons de construire, en commençant par les plus fondamentales.

## 1. ✅ Sécurité et Contrôle des Coûts via un Système de Tickets (Terminé)

### Le Principe
L'objectif était de prévenir les abus et de maîtriser les coûts via un système de tickets quotidiens.

### État Actuel
- **Fonctionnalité Complète :** Le système de décompte, de blocage et de recharge quotidienne est 100% fonctionnel et intégré, à la fois pour les uploads et pour l'utilisation de l'IA.
- **Documentation :** Le parcours de développement est documenté dans `docs/ticket-system-status.md` et `docs/feature-dev-log.md`.

Ce système de "tickets" est devenu une fonctionnalité centrale de l'expérience utilisateur, offrant une base solide pour de futures évolutions (monétisation, récompenses, etc.).

## 2. ✅ Organisation par Galeries d'Images (Terminé)

### Le Principe
Permettre aux utilisateurs de regrouper leurs images dans des "Galeries" (ou albums) pour une meilleure organisation.

### État Actuel
- **Fonctionnalité Complète :** Le système est stable et complet. Les utilisateurs peuvent créer, voir, supprimer des galeries et gérer leur contenu (ajouter/retirer des images individuellement ou en groupe).
- **Développement :** L'implémentation a inclus la gestion des erreurs (404) et l'optimisation des performances pour éviter les boucles de rendu.
- **Documentation :** Le développement de cette fonctionnalité est consigné dans le `docs/feature-dev-log.md`.

## 3. ✅ Intégration de l'IA : Génération & Édition (Terminé)

Maintenant que la base de l'application est stable et sécurisée, nous nous concentrons sur l'IA pour enrichir l'expérience.

### La Vision
L'objectif est de mettre en œuvre la vision définie dans notre document d'idées (`docs/idées.md`), à savoir transformer Clikup en un **assistant complet pour la création de contenu pour les réseaux sociaux**.

### Plan de Développement et État Actuel
Le plan technique détaillé pour cette intégration est disponible dans `docs/ia-feature-plan.md`. Il était découpé en plusieurs phases qui sont maintenant terminées :

1.  **Phase 1 (Terminée) :** Génération automatique de descriptions, titres et hashtags pour les images.
2.  **Phase 2 (Terminée) :** Édition d'images par IA en utilisant le langage naturel.
    *   **Moteur IA Fonctionnel :** Le flow Genkit `editImageFlow` a été créé et intégré.
    *   **Interface Complète :** Une page dédiée (`/edit/[imageId]`) permet aux utilisateurs d'entrer des instructions, de voir un aperçu "avant/après" et de sauvegarder leur création.
    *   **Améliorations UX :** Des catégories de suggestions (y compris une catégorie saisonnière pour Noël) ont été ajoutées pour guider l'utilisateur. Le design a été affiné pour une meilleure clarté.
    *   **Préparation à la Monétisation :** Le message d'épuisement des tickets a été rendu plus incitatif ("Plus de tickets ? Rechargez ici !").

## 4. 🚀 Prochaines Étapes : Amélioration Continue et Monétisation

Avec le cœur des fonctionnalités IA en place, les prochaines étapes se concentreront sur :

*   **Phase 3 (Long Terme) :** Simplification du partage vers les réseaux sociaux.
*   **Implémentation de la Boutique :** Connecter le bouton "Rechargez ici !" à une solution de paiement (Stripe, par exemple) pour permettre l'achat de packs de tickets.
*   **Amélioration des Performances :** Optimiser le chargement des images et la réactivité de l'application.
