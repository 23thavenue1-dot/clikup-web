
'use server';

import { ai } from '@/ai/genkit';
import { type ChatbotOutput, type ChatbotInput } from '@/ai/schemas/chatbot-schemas';
import { createGallery, addImageToGallery } from '@/lib/firestore'; 
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase'; // Gardé pour le client, mais l'admin sera utilisé pour les outils


// --- Définition des Outils avec Authentification Admin ---

const createGalleryTool = ai.defineTool(
  {
    name: 'createGallery',
    description: "Crée un nouvel album ou une nouvelle galerie d'images pour l'utilisateur.",
    inputSchema: z.object({
      name: z.string().describe("Le nom de la galerie à créer."),
      userId: z.string().describe("L'ID de l'utilisateur qui crée la galerie.")
    }),
    outputSchema: z.string(),
  },
  async ({ name, userId }) => {
    // Le userId est maintenant un paramètre direct du tool, fourni par le prompt
    if (!userId) {
      return "Erreur critique : L'ID utilisateur est manquant.";
    }
    const { firestore } = initializeFirebase(); // Utilise l'initialisation standard
    try {
      await createGallery(firestore, userId, name);
      return `Galerie "${name}" créée avec succès.`;
    } catch (error) {
      console.error("Erreur de l'outil createGallery:", error);
      return `Désolé, je n'ai pas pu créer la galerie "${name}". Une erreur est survenue.`;
    }
  }
);


const listGalleriesTool = ai.defineTool(
  {
    name: 'listGalleries',
    description: "Récupère et liste toutes les galeries créées par l'utilisateur.",
    inputSchema: z.object({
        userId: z.string().describe("L'ID de l'utilisateur.")
    }),
    outputSchema: z.string(),
  },
  async ({ userId }) => {
    if (!userId) {
      return "Erreur critique : L'ID utilisateur est manquant.";
    }
    const { firestore } = initializeFirebase();
    try {
      const galleriesRef = collection(firestore, `users/${userId}/galleries`);
      const q = query(galleriesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return "Vous n'avez aucune galerie pour le moment.";
      }
      
      const galleryNames = querySnapshot.docs.map(doc => `- ${doc.data().name}`);
      return `Voici la liste de vos galeries :\n${galleryNames.join('\n')}`;
    } catch (error) {
      console.error("Erreur de l'outil listGalleries:", error);
      return "Désolé, je n'ai pas pu récupérer la liste de vos galeries.";
    }
  }
);

const addImageToGalleryTool = ai.defineTool(
  {
    name: 'addImageToGallery',
    description: "Ajoute une image existante à une galerie existante.",
    inputSchema: z.object({
      imageName: z.string().describe("Le nom (titre ou nom de fichier) de l'image à ajouter."),
      galleryName: z.string().describe("Le nom de la galerie de destination."),
      userId: z.string().describe("L'ID de l'utilisateur.")
    }),
    outputSchema: z.string(),
  },
  async ({ imageName, galleryName, userId }) => {
    if (!userId) {
        return "Erreur critique : L'ID utilisateur est manquant.";
    }
    const { firestore } = initializeFirebase();
    try {
      // 1. Find the gallery
      const galleriesRef = collection(firestore, `users/${userId}/galleries`);
      const galleryQuery = query(galleriesRef, where('name', '==', galleryName), limit(1));
      const gallerySnapshot = await getDocs(galleryQuery);
      if (gallerySnapshot.empty) {
        return `Désolé, je n'ai pas trouvé de galerie nommée "${galleryName}". Voulez-vous que je la crée ? Vous pouvez aussi me demander de lister vos galeries.`;
      }
      const galleryDoc = gallerySnapshot.docs[0];

      // 2. Find the image (by title or originalName)
      const imagesRef = collection(firestore, `users/${userId}/images`);
      let imageQuery = query(imagesRef, where('title', '==', imageName), limit(1));
      let imageSnapshot = await getDocs(imageQuery);
      if (imageSnapshot.empty) {
          imageQuery = query(imagesRef, where('originalName', '==', imageName), limit(1));
          imageSnapshot = await getDocs(imageQuery);
      }
      if (imageSnapshot.empty) {
        return `Désolé, je n'ai pas trouvé d'image nommée "${imageName}". Assurez-vous que le nom est correct.`;
      }
      const imageDoc = imageSnapshot.docs[0];

      // 3. Add the image to the gallery
      await addImageToGallery(firestore, userId, imageDoc.id, galleryDoc.id);

      return `C'est fait ! L'image "${imageName}" a été ajoutée à la galerie "${galleryName}".`;

    } catch (error) {
      console.error("Erreur de l'outil addImageToGallery:", error);
      return `Désolé, une erreur est survenue lors de l'ajout de l'image.`;
    }
  }
);


export async function askChatbot(input: ChatbotInput): Promise<ChatbotOutput> {
  const historyPrompt = input.history
    .map(message => `${message.role}: ${message.content}`)
    .join('\n');
    
  const fullPrompt = `
    USER_ID: ${input.userId}

    Conversation History:
    ${historyPrompt}
    assistant:
  `;

  const llmResponse = await ai.generate({
    prompt: fullPrompt,
    system: `You are a helpful and friendly assistant for an application called Clikup. Your goal is to answer user questions, guide them, and perform actions on their behalf using the tools you have available.

- **Your User ID is {{USER_ID}}. You MUST provide this ID in the 'userId' parameter for ANY tool you call.** This is mandatory for all operations.
- **Listen to the user's need, not just their words.** If a user asks "quels sont mes albums ?", use the listGalleries tool. If they say "je veux vendre plus", recommend the "E-commerce" description generation. If they say "je suis à court d'idées", recommend the "Coach Stratégique".
- **Use your tools when appropriate.** If the user asks to perform an action you are capable of, use the corresponding tool and always include the userId.
- **Clarify if needed.** If a tool requires information the user hasn't provided (e.g., asking to add an image without saying which one), ask for the missing details.
- **Confirm your actions.** After using a tool, present the result clearly to the user.
- **Be concise and helpful.**

---
## DOCUMENTATION CLIKUP & OUTILS DISPONIBLES

### Outils (Rappel : toujours fournir le 'userId')
- **createGallery(name: string, userId: string):** Utilise cet outil pour créer un nouvel album ou une galerie.
- **listGalleries(userId: string):** Utilise cet outil pour lister les galeries de l'utilisateur.
- **addImageToGallery(imageName: string, galleryName: string, userId: string):** Ajoute une image à une galerie.

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
    tools: [createGalleryTool, listGalleriesTool, addImageToGalleryTool],
  });

  return { content: llmResponse.text };
}
