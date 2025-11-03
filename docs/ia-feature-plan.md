# Plan de Développement Technique : Intégration de l'IA

Ce document détaille les étapes techniques pour transformer "Clikup" en un assistant de contenu intelligent, comme défini dans `docs/idées.md`.

## Phase 1 : Génération de Description par IA (Court Terme)

**Objectif :** Permettre à l'IA de générer une description pour une image, et ainsi activer le succès "Futuriste".

**Technologies Clés :**
*   **Genkit** : Pour créer le flow d'IA.
*   **Modèle Gemini** : Pour l'analyse d'image et la génération de texte.

**Étapes d'Implémentation :**

1.  **Créer un Flow Genkit `generateImageDescriptionFlow` :**
    *   **Fichier :** `src/ai/flows/generate-description-flow.ts`
    *   **Input :** `{ imageUrl: string }`
    *   **Output :** `{ description: string, title: string, hashtags: string[] }`
    *   **Logique :** Le flow prendra l'URL d'une image en entrée, utilisera le modèle Gemini pour l'analyser et générera une description textuelle, un titre et une liste de hashtags pertinents.

2.  **Mettre à jour l'Interface Utilisateur (`src/app/ImageList.tsx`) :**
    *   Dans la fenêtre de dialogue "Modifier la description", activer le bouton "Générer avec l'IA".
    *   Au clic, appeler le nouveau flow Genkit avec l'URL de l'image sélectionnée.
    *   Afficher un état de chargement pendant que l'IA travaille.
    *   Remplir le champ de texte de la description avec le résultat généré par l'IA.
    *   L'utilisateur peut alors accepter ou modifier le texte avant de sauvegarder.

3.  **Activer le Succès "Futuriste" (`src/app/dashboard/page.tsx`) :**
    *   Le succès se débloquera lorsqu'un utilisateur sauvegardera une description qui a été initialement générée par l'IA. Il faudra ajouter un marqueur (par exemple, un champ `generatedByAI: true` temporaire) pour le détecter.

## Phase 2 : Retouche d'Image par IA (Moyen Terme)

**Objectif :** Permettre à l'utilisateur de modifier une image en décrivant les changements en langage naturel.

**Technologies Clés :**
*   **Genkit**
*   **Modèles d'édition d'image de Gemini** (ou un modèle d'image-vers-image).

**Étapes d'Implémentation :**

1.  **Créer un Flow Genkit `editImageFlow` :**
    *   **Input :** `{ imageUrl: string, prompt: string }` (où `prompt` est l'instruction de l'utilisateur, ex: "Rends le ciel plus dramatique").
    *   **Output :** `{ newImageUrl: string }` (l'URL de la nouvelle image générée).

2.  **Mettre à jour l'Interface Utilisateur :**
    *   Créer une nouvelle section ou un nouveau dialogue d'édition avancé.
    *   L'utilisateur pourra voir son image et écrire une instruction dans un champ de texte.
    *   Après la génération, afficher l'image "avant" et "après" pour comparaison.
    *   Permettre à l'utilisateur de sauvegarder la nouvelle version de l'image.

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
