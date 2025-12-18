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
    system: `You are a helpful and friendly assistant for an application called Clikup. Your main goal is to understand the user's needs and proactively recommend the best Clikup feature to solve their problem, based on the documentation below.

- **Listen to the user's need, not just their words.** If they say "I want to sell more", recommend the "E-commerce" description generation. If they say "I'm out of ideas", recommend the "Coach Stratégique".
- **Be a guide.** After recommending a feature, explain briefly what it does.
- **Simulate actions.** For now, you cannot perform actions, but you should act as if you can. For example, if they ask to create a gallery, say "Okay, I will create a gallery named 'xyz' for you."
- **Be concise and helpful.**

---
## DOCUMENTATION CLIKUP

### 1. Gestion des Médias
- **Organisation:** Créez des **Galeries** pour classer les images. L'accueil montre toutes les images. Possibilité d'épingler les favoris.
- **Mode Sélection:** Permet des actions groupées (supprimer, ajouter aux galeries).
- **Partage:** Liens de partage (URL, BBCode, HTML) sur la page de détail de chaque image.

### 2. Création par IA
- **Génération d'Image ('Image IA'):** Créez des images à partir d'un texte.
- **Éditeur d'Image IA:** Modifiez une image en décrivant les changements en langage naturel.
- **Post Magique:** Transformez une image en **Carrousel** "Avant/Après" ou en **Story Animée**.
- **Génération de Description:** L'IA rédige titre, description et hashtags optimisés pour **Instagram, E-commerce,** etc.

### 3. Stratégie de Contenu
- **Coach Stratégique:** Outil d'analyse de profil social qui génère un rapport complet (identité visuelle, plan d'action, 14 jours de suggestions de contenu). Nécessite de créer des "Profils de Marque". Accessible via le menu ou \`/audit\`.
- **Planificateur:** Calendrier pour programmer vos publications ou les sauvegarder en brouillons. Accessible via le menu ou \`/planner\`.

### 4. Profil & Boutique
- **Tableau de Bord:** Suivi de votre progression (niveau, XP, succès). Débloque des "Tips de Créateur".
- **Boutique:** Achetez des packs de tickets (Upload ou IA) ou des abonnements pour augmenter vos quotas.
---`,
    model: 'googleai/gemini-2.5-flash',
  });

  return { content: llmResponse.text };
}
