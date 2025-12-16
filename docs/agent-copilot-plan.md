# Plan de Conception : Agent Conversationnel "Clikup Copilot"

Ce document détaille la vision, les fonctionnalités et le plan d'implémentation technique pour l'intégration d'un agent conversationnel avancé au sein de l'application Clikup.

---

## 1. Vision : Un Copilote pour la Créativité

L'objectif est d'intégrer un agent IA, surnommé **"Clikup Copilot"**, qui agit comme un véritable partenaire pour l'utilisateur. Accessible via une icône de chat discrète, il ne se contente pas de répondre aux questions : il comprend le contexte, exécute des actions et anticipe les besoins.

L'expérience doit être fluide et transformer la manière dont l'utilisateur interagit avec l'application, passant d'une série de clics à une simple conversation.

---

## 2. Capacités Clés de l'Agent

### a) Guider et Éduquer
Le Copilot doit être capable de répondre aux questions sur le fonctionnement de l'application et de guider l'utilisateur.
-   **Exemple :**
    -   *Utilisateur :* "Comment je fais pour générer un carrousel ?"
    -   *Copilot :* "C'est très simple. Allez sur la page d'une image, cliquez sur 'Éditer avec l'IA', puis choisissez l'un des formats de publication professionnelle. Je peux vous y emmener maintenant si vous voulez."

### b) Exécuter des Tâches (Action-Taking)
C'est la fonctionnalité la plus puissante. L'agent doit être directement connecté aux flows de l'application pour agir sur demande.
-   **Exemple :**
    -   *Utilisateur :* "Génère-moi une image d'un astronaute sur une plage au format story."
    -   *Copilot :* *(Lance le flow `generateImageFlow` avec les bons paramètres et affiche le résultat directement dans la conversation.)* "Voici votre création. Souhaitez-vous l'enregistrer ou l'affiner ?"

### c) Être Proactif et Contextuel
L'agent doit pouvoir initier la conversation lorsqu'il détecte une opportunité pertinente.
-   **Exemple :**
    -   *(L'utilisateur vient de téléverser une photo de portrait.)*
    -   *Copilot (pop-up) :* "Belle photo ! J'ai remarqué que c'est un portrait. Voulez-vous que je l'améliore avec un éclairage de studio professionnel ?"

### d) Accéder aux Informations du Compte
Il doit pouvoir fournir des informations spécifiques à l'utilisateur de manière conversationnelle.
-   **Exemple :**
    -   *Utilisateur :* "Combien de tickets IA il me reste ?"
    -   *Copilot :* "Il vous reste 47 tickets IA. Vous avez assez de marge pour de nombreuses créations !"

---

## 3. Plan d'Implémentation Technique

Ce projet ambitieux (difficulté **élevée**) peut être décomposé en trois étapes successives.

### Étape 1 : Le "Cerveau" de l'Agent (Difficulté : Moyenne)

-   **Tâche :** Créer un nouveau flow Genkit, `agentConversationFlow`.
-   **Logique :** Ce flow prendra l'historique de la conversation et le dernier message de l'utilisateur. Il utilisera un modèle de langage pour en comprendre l'intention.
-   **"Tools" (Outils) :** C'est le point crucial. Nous devrons définir des "outils" que le modèle d'IA peut décider d'utiliser pour répondre. Chaque outil sera une fonction TypeScript qui encapsule nos flows Genkit existants.
    -   `generateImageTool(prompt: string, aspectRatio: string)`
    -   `getImageDescriptionTool(imageId: string)`
    -   `getUserStatsTool()`
    -   `navigateToPageTool(page_name: string)`

### Étape 2 : L'Interface de Chat (Difficulté : Moyenne à Élevée)

-   **Tâche :** Construire le composant React pour la bulle de chat.
-   **Logique :**
    -   Gérer l'état de la conversation (messages, historique).
    -   Afficher les réponses de l'agent, qui peuvent être du texte, une image générée, ou des boutons d'action.
    -   Envoyer les messages de l'utilisateur à notre `agentConversationFlow`.
-   **Défi :** Créer une expérience utilisateur réactive et agréable, avec gestion des états de chargement.

### Étape 3 : La Proactivité (Difficulté : Élevée)

-   **Tâche :** Permettre au Copilot de démarrer une conversation.
-   **Logique :** Mettre en place un système d'événements à l'échelle de l'application. Par exemple, l'événement "newImageUploaded" pourrait être écouté par le Copilot, qui analyserait le contexte (type d'image, profil utilisateur) et déciderait s'il est pertinent de proposer une action.

---

## 4. Conclusion

L'intégration d'un "Clikup Copilot" est une évolution naturelle et très stratégique pour l'application. Elle renforce sa position d'outil intelligent et peut considérablement améliorer l'engagement et la satisfaction des utilisateurs en rendant les fonctionnalités puissantes plus accessibles que jamais.

L'approche par étapes est la clé du succès pour un projet de cette envergure.
