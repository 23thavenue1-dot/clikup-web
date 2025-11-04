# Plan de Développement Technique : Intégration de l'IA

Ce document détaille les étapes techniques pour transformer "Clikup" en un assistant de contenu intelligent, comme défini dans `docs/idées.md`.

## Phase 1 : Génération de Description par IA (Terminé)

**Objectif :** Permettre à l'IA de générer une description, un titre et des hashtags pour une image, afin d'enrichir le contenu et d'activer le succès "Futuriste".

**Technologies Clés :**
*   **Genkit** : Pour créer le flow d'IA.
*   **Modèle Gemini** : Pour l'analyse d'image et la génération de texte.

**État :** Terminé. Le flow `generateImageDescriptionFlow` est fonctionnel et intégré à l'interface de modification d'image. Le système de tickets IA est également en place pour réguler son utilisation.

## Phase 2 : Retouche d'Image par IA (En Cours)

**Objectif :** Permettre à l'utilisateur de modifier une image en décrivant les changements en langage naturel.

**Technologies Clés :**
*   **Genkit**
*   **Modèles d'édition d'image de Gemini** (ou un modèle d'image-vers-image).

**Étapes d'Implémentation :**

1.  **Créer un Flow Genkit `editImageFlow` (Terminé) :**
    *   **Fichier :** `src/ai/flows/edit-image-flow.ts`
    *   **Input :** `{ imageUrl: string, prompt: string }` (où `prompt` est l'instruction de l'utilisateur, ex: "Rends le ciel plus dramatique").
    *   **Output :** `{ newImageUrl: string }` (l'URL de la nouvelle image générée, encodée en data URI).
    *   **Statut :** Le "moteur" de la fonctionnalité est en place.

2.  **Mettre à jour l'Interface Utilisateur (À Faire) :**
    *   Créer une nouvelle section ou un nouveau dialogue d'édition avancé dans l'application.
    *   L'utilisateur pourra voir son image et écrire une instruction dans un champ de texte.
    *   Après la génération, afficher l'image "avant" et "après" pour comparaison.
    *   Permettre à l'utilisateur de sauvegarder la nouvelle version de l'image, ce qui consommera un ticket IA.

## Phase 3 : Partage Simplifié vers les Réseaux Sociaux (Long Terme)

**Objectif :** Faciliter la publication du contenu créé (image retouchée + description générée) sur les réseaux sociaux.

**Approche 1 (Simple) :**

1.  Dans la fenêtre de partage, après qu'une image ait été retouchée et une description générée, ajouter :
    *   Un bouton "Copier la description et les hashtags".
    *   Un bouton "Télécharger l'image finale".
2.  L'utilisateur peut alors facilement coller le texte et téléverser l'image manuellement sur la plateforme de son choix.

**Approche 2 (Avancée - Intégration API) :**

1.  **Recherche et Développement :** Étudier les API de développeur de Meta (pour Instagram/Facebook) et de X pour comprendre les exigences et les limitations du partage de contenu.
2.  **Implémentation :**
    *   Mettre en place un flux d'authentification OAuth pour que les utilisateurs puissent connecter leurs comptes de réseaux sociaux à Clikup.
    *   Utiliser les API pour envoyer l'image et le texte directement depuis Clikup.
    *   Cela nécessite une gestion complexe des jetons d'accès et des permissions.
