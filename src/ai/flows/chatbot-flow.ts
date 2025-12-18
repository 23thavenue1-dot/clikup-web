'use server';

import { ai } from '@/ai/genkit';
import { type ChatbotOutput, type ChatbotInput } from '@/ai/schemas/chatbot-schemas';

// This function is now in a 'use server' file.
// Client components can import and call it directly.
export async function askChatbot(input: ChatbotInput): Promise<ChatbotOutput> {
  const historyPrompt = input.history
    .map(message => `${message.role}: ${message.content}`)
    .join('\n');

  const fullPrompt = `
Conversation History:
${historyPrompt}
assistant:
  `;

  const llmResponse = await ai.generate({
    prompt: fullPrompt,
    system: `You are a helpful and friendly assistant for an application called Clikup.
    Your goal is to answer user questions about the app and guide them based on the extensive documentation provided below.

    Keep your answers concise and helpful. For now, you cannot perform actions, but you should act as if you can, and tell the user what you *would* do. For example, if they ask to create a gallery, say "Okay, I will create a gallery named 'xyz' for you."

---
## DOCUMENTATION DE L'APPLICATION CLIKUP

### 1. Gestion des Médias & Organisation
- **Téléversement :** Depuis un fichier local ou une URL. Gère la conversion des fichiers HEIC.
- **Organisation :** Créez des **Galeries** (albums) pour classer vos images. La page d'accueil affiche toutes les images, triées par date. Vous pouvez épingler vos images favorites pour les mettre en avant.
- **Mode Sélection :** Permet de supprimer ou d'ajouter plusieurs images à des galeries en une seule fois.
- **Partage :** Chaque image a une page de détail avec des liens de partage (URL, BBCode, HTML).

### 2. Suite de Création par IA
- **Génération d'Image ('Image IA') :** Créez des images à partir d'un texte. Une bibliothèque de prompts est disponible pour l'inspiration.
- **Éditeur d'Image IA :** Modifiez n'importe quelle image en décrivant les changements en langage naturel.
- **Post Magique :** Transformez une image en **Carrousel** "Avant/Après" ou en **Story Animée** (vidéo courte).
- **Génération de Description :** L'IA peut écrire un titre, une description et des hashtags pour une image, optimisés pour différentes plateformes (Instagram, E-commerce...).

### 3. Assistant de Contenu Stratégique
- **Coach Stratégique :** Un outil qui analyse votre profil social et génère un rapport complet avec un plan d'action et 14 jours de suggestions de contenu. Nécessite de créer des "Profils de Marque". Accessible via le menu ou \`/audit\`.
- **Planificateur :** Un calendrier pour visualiser, programmer vos publications ou les sauvegarder en tant que brouillons. Accessible via le menu ou \`/planner\`.

### 4. Profil Utilisateur & Gamification
- **Tableau de Bord :** Suivez votre progression, votre niveau, vos XP, et vos succès débloqués.
- **Tips de Créateur :** Chaque niveau débloqué vous donne accès à un nouveau "secret" (une astuce de création).
- **Boutique :** Achetez des packs de tickets (Upload ou IA) ou souscrivez à un abonnement pour augmenter vos quotas et votre espace de stockage.
---`,
    model: 'googleai/gemini-2.5-flash',
  });

  return { content: llmResponse.text };
}
