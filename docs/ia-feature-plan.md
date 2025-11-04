# Plan de Développement Technique : Intégration de l'IA

Ce document détaille les étapes techniques pour transformer "Clikup" en un assistant de contenu intelligent, comme défini dans `docs/idées.md`.

## Phase 1 : Génération de Description par IA (Terminé)

**Objectif :** Permettre à l'IA de générer une description, un titre et des hashtags pour une image, afin d'enrichir le contenu et d'activer le succès "Futuriste".

**Technologies Clés :**
*   **Genkit** : Pour créer le flow d'IA.
*   **Modèle Gemini** : Pour l'analyse d'image et la génération de texte.

**État :** Terminé. Le flow `generateImageDescriptionFlow` est fonctionnel et intégré à l'interface de modification d'image. Le système de tickets IA est également en place pour réguler son utilisation.

## Phase 2 : Retouche d'Image par IA (Terminé)

**Objectif :** Permettre à l'utilisateur de modifier une image en décrivant les changements en langage naturel.

**Technologies Clés :**
*   **Genkit**
*   **Modèles d'édition d'image de Gemini** (`gemini-2.5-flash-image-preview`).

**Implémentation Réalisée :**

1.  **Création du Flow Genkit `editImageFlow` :**
    *   **Fichier :** `src/ai/flows/edit-image-flow.ts`
    *   **Input :** `{ imageUrl: string, prompt: string }`
    *   **Output :** `{ newImageUrl: string }` (l'URL de la nouvelle image en data URI).
    *   **Statut :** Le "moteur" de la fonctionnalité est en place.

2.  **Création de la Page d'Édition :**
    *   **Fichier :** `src/app/edit/[imageId]/page.tsx`
    *   Mise en place d'une interface complète où l'utilisateur voit son image originale et le résultat généré côte à côte.
    *   L'utilisateur peut écrire une instruction dans une zone de texte dédiée.
    *   Après génération, l'image "avant" et "après" est affichée pour comparaison.
    *   L'utilisateur peut sauvegarder la nouvelle version de l'image (ce qui la téléverse comme une nouvelle image dans sa galerie) et consomme un ticket IA.

3.  **Ajout de Suggestions Créatives :**
    *   **Catégories Intégrées :** Des catégories de prompts prédéfinis ("Retouches de Portrait", "Changements de Fond", "Ambiance & Style", "Effets Spéciaux") ont été ajoutées pour guider l'utilisateur.
    *   **Catégorie Événementielle :** Une catégorie "Événements & Saisons" a été ajoutée et inaugurée avec des prompts sur le thème de Noël, rendant l'application dynamique et contextuelle.

4.  **Améliorations UX :**
    *   Le bouton de génération a été centré au-dessus des deux colonnes pour une meilleure visibilité.
    *   Les cadres d'instruction et de suggestion ont été rendus de hauteur égale pour une meilleure cohésion visuelle.
    *   Le message d'épuisement des tickets a été modifié en "Plus de tickets ? Rechargez ici !", préparant le terrain pour la future monétisation.

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
