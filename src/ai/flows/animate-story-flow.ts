
'use server';
/**
 * @fileOverview Flow Genkit pour l'animation d'une image statique en vidéo (Story Animée).
 */

import { ai } from '@/ai/genkit';
import { AnimateStoryInputSchema, AnimateStoryOutputSchema, type AnimateStoryInput, type AnimateStoryOutput } from '@/ai/schemas/story-animation-schemas';
import { MediaPart } from 'genkit';


// Helper function to download the video and convert to data URI
async function downloadAndEncodeVideo(videoPart: MediaPart): Promise<string> {
    if (!videoPart?.media?.url || !videoPart?.media?.contentType) {
        throw new Error('Media part invalide pour la vidéo.');
    }

    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("La clé d'API GEMINI_API_KEY est manquante dans les variables d'environnement.");
    }
    
    const videoDownloadUrl = `${videoPart.media.url}&key=${apiKey}`;
    
    const response = await fetch(videoDownloadUrl);

    if (!response.ok || !response.body) {
        throw new Error(`Échec du téléchargement de la vidéo: ${response.statusText}`);
    }

    const videoBuffer = await response.buffer();
    const base64Video = videoBuffer.toString('base64');
    return `data:${videoPart.media.contentType};base64,${base64Video}`;
}


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
    
    // --- CHANGEMENT DE MODÈLE POUR PLUS DE STABILITÉ ---
    // Nous utilisons gemini-2.5-flash-image-preview qui peut aussi générer des vidéos (cinemagraphs)
    // C'est plus fiable que Veo qui est encore très restrictif.
    const { media, output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: imageUrl } },
            { text: `Crée une vidéo animée (cinemagraph) de 5 secondes à partir de cette image, en suivant cette instruction : "${prompt}". L'animation doit être subtile et élégante.` },
        ],
        config: {
            responseModalities: ['TEXT', 'IMAGE'], // Correction: ce modèle attend IMAGE, pas VIDEO.
             safetySettings: [
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }
            ],
        },
    });

    if (!media || !media.url || !media.contentType?.startsWith('video/')) {
        const errorDetails = JSON.stringify(output, null, 2);
        console.error("Résultat de l'opération inattendu:", errorDetails);
        throw new Error("Aucune vidéo n'a été trouvée dans le résultat de l'opération. L'IA a peut-être refusé de générer le contenu.");
    }
    
    // Pour ce modèle, le data URI est souvent directement retourné, pas besoin de re-télécharger.
    // Mais on garde la logique au cas où une URL temporaire serait renvoyée.
    if (media.url.startsWith('data:')) {
        return {
          videoUrl: media.url,
        };
    }
    
    // La logique de téléchargement est conservée comme fallback.
    const videoDataUri = await downloadAndEncodeVideo({ media });

    return {
      videoUrl: videoDataUri,
    };
  }
);
