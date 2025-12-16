
'use server';
/**
 * @fileOverview Flow Genkit pour l'animation d'une image statique en vidéo (Story Animée).
 */

import { ai } from '@/ai/genkit';
import { AnimateStoryInputSchema, AnimateStoryOutputSchema, type AnimateStoryInput, type AnimateStoryOutput } from '@/ai/schemas/story-animation-schemas';

export async function animateStory(input: AnimateStoryInput): Promise<AnimateStoryOutput> {
  return animateStoryFlow(input);
}

const animateStoryFlow = ai.defineFlow(
  {
    name: 'animateStoryFlow',
    inputSchema: AnimateStoryInputSchema,
    outputSchema: AnimateStoryOutputSchema,
  },
  async ({ imageUrl, prompt, aspectRatio }) => {
    
    // Appel à l'IA simplifié pour correspondre aux autres flows fonctionnels
    const { media, output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: imageUrl } },
            { text: `Crée une vidéo animée (cinemagraph) de 5 secondes à partir de cette image, en suivant cette instruction : "${prompt}". L'animation doit être subtile et élégante.` },
        ],
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
             safetySettings: [
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }
            ],
        },
    });

    // Vérification simplifiée : on s'assure juste qu'un média a été retourné.
    if (!media || !media.url) {
        const errorDetails = JSON.stringify(output, null, 2);
        console.error("Résultat de l'opération inattendu:", errorDetails);
        throw new Error("Aucun média n'a été trouvé dans le résultat de l'opération. L'IA a peut-être refusé de générer le contenu.");
    }
    
    // On fait confiance au modèle et on retourne directement l'URL du média.
    return {
      videoUrl: media.url,
    };
  }
);
