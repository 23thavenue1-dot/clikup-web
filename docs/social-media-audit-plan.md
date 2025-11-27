# Plan de Conception : Audit de Profil par l'IA

Ce document détaille la conception et l'implémentation de la fonctionnalité "Audit de Profil IA", un outil stratégique pour les créateurs de contenu.

---

## 1. Objectif de la Fonctionnalité

Permettre à un utilisateur de soumettre son profil de réseau social (via une sélection de contenus) à une analyse par IA afin d'obtenir un rapport complet et actionnable pour améliorer son identité de marque, sa stratégie de contenu et son engagement.

---

## 2. Parcours Utilisateur (UX)

L'expérience doit être celle d'un **assistant guidé** (wizard), simple et intuitif, qui se déroule en plusieurs étapes claires.

### Étape A : Le Point d'Entrée

1.  **Nouvel Élément de Navigation :** Ajouter un lien "Analyse IA" dans la barre de navigation principale (`Navbar.tsx`). Il sera accompagné d'une icône pertinente (ex: `LineChart`, `SearchCheck`).
2.  **Redirection :** Ce lien redirige l'utilisateur vers la nouvelle page `/audit`.

### Étape B : La Page d'Audit (`/audit/page.tsx`)

Cette page est le cœur de l'assistant. Elle sera structurée comme un formulaire en plusieurs étapes.

*   **Étape 1 : Plateforme & Objectifs**
    *   **Champ :** Un `Select` pour choisir la plateforme (Instagram, TikTok, Facebook, etc.).
    *   **Champ :** Un `Select` où l'utilisateur choisit son objectif principal parmi une liste d'options optimisées :
        *   "Augmenter mon engagement et créer une communauté."
        *   "Professionnaliser mon image de marque."
        *   "Trouver plus de clients ou d'opportunités."
        *   "Définir une identité visuelle plus cohérente et mémorable."
        *   "Diversifier mon contenu et trouver de nouvelles idées."

*   **Étape 2 : Identité Visuelle**
    *   **Titre :** "Importez une sélection de vos publications."
    *   **Conseil :** Ajouter un texte explicatif : "Pour une analyse optimale, sélectionnez entre 6 et 9 publications qui représentent le mieux votre style actuel. **Astuce :** Incluez une capture d'écran de votre grille de profil ('feed') pour que l'IA puisse analyser l'harmonie globale."
    *   **Composant :** Une grille interactive permettant à l'utilisateur de sélectionner des images directement depuis sa galerie Clikup.

*   **Étape 3 : Identité Rédactionnelle**
    *   **Titre :** "Copiez-collez le texte de 2 ou 3 de vos publications récentes."
    *   **Composant :** Trois champs `Textarea` pour que l'utilisateur puisse coller ses descriptions.

*   **Étape 4 : Lancement**
    *   **Récapitulatif :** Un bref résumé ("Analyse pour Instagram avec 9 images et 3 textes.").
    *   **Bouton d'Action :** Un bouton "Lancer l'analyse (coûte 5 tickets IA)". Ce bouton sera désactivé tant que tous les champs obligatoires ne sont pas remplis.
    *   **État de Chargement :** Après le clic, l'interface affichera une animation de chargement avec des messages engageants ("L'IA analyse vos couleurs...", "L'IA étudie votre style...").

### Étape C : La Page de Rapport (`/audit/resultats/[resultId]/page.tsx`)

Une fois l'analyse terminée, l'utilisateur est redirigé vers une page dédiée à son rapport. Cette page est conçue pour être claire, lisible et inspirante.

*   **Structure :** Utilisation de `Card` pour chaque section du rapport.
*   **Contenu du Rapport :**
    1.  **Carte "Votre Identité Actuelle" :**
        *   Titre: "Diagnostic de votre Identité Visuelle".
        *   Contenu: L'IA génère des mots-clés qui décrivent le style perçu (ex: "Naturel", "Contraste élevé", "Palette chaude").
    2.  **Carte "Points Forts & Axes d'Amélioration" :**
        *   Titre: "Analyse Stratégique".
        *   Contenu: Deux listes à puces claires : ce qui fonctionne bien et ce qui pourrait être amélioré.
    3.  **Carte "Stratégie de Contenu Recommandée" :**
        *   Titre: "Suggestions pour vos Prochains Contenus".
        *   Contenu: Des idées concrètes de publications (ex: "Essayez un carrousel avant/après", "Faites une vidéo des coulisses").
    4.  **Carte "Plan d'Action Personnalisé" :**
        *   Titre: "Votre Programme sur 7 Jours".
        *   Contenu: Un tableau simple (Jour 1: Poster une photo de type X, Jour 2: Faire une Story sondage, etc.).

---

## 3. Implémentation Technique

### a) Nouveau Flow Genkit (`src/ai/flows/social-audit-flow.ts`)

*   **Input Schema (Zod) :**
    *   `platform`: `string`
    *   `goal`: `string` (l'objectif choisi dans la liste)
    *   `image_urls`: `array of strings` (les data URIs des images sélectionnées)
    *   `post_texts`: `array of strings`
*   **Output Schema (Zod) :**
    *   `visual_identity`: `object` avec `keywords: array of strings` et `summary: string`.
    *   `strategic_analysis`: `object` avec `strengths: array of strings` et `improvements: array of strings`.
    *   `content_strategy`: `array of objects`, chaque objet contenant `idea: string` et `description: string`.
    *   `action_plan`: `array of objects`, chaque objet contenant `day: number` et `action: string`.
*   **Prompt :** Un prompt maître très détaillé qui instruit l'IA d'agir comme un coach en stratégie de contenu et de structurer sa réponse selon le schéma de sortie défini, en tenant compte de l'objectif de l'utilisateur.

### b) Nouvelles Pages React

*   `src/app/audit/page.tsx` : La page principale de l'assistant, gérant l'état des différentes étapes du formulaire.
*   `src/app/audit/resultats/[resultId]/page.tsx` : La page qui affichera les résultats de l'analyse.

### c) Modèle de Données

*   Les résultats de chaque audit pourraient être sauvegardés dans une nouvelle sous-collection `audits` dans le document de l'utilisateur (`/users/{userId}/audits/{auditId}`) pour qu'il puisse consulter ses rapports passés.

---

Ce plan fournit une base solide pour construire une fonctionnalité cohérente, utile et intuitive qui renforcera la proposition de valeur de Clikup.
