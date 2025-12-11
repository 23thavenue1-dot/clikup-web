
'use server';
/**
 * @fileOverview Flow Genkit pour la génération de carrousels d'images.
 */

import { ai } from '@/ai/genkit';
import { GenerateCarouselInputSchema, GenerateCarouselOutputSchema, type GenerateCarouselInput, type GenerateCarouselOutput } from '@/ai/schemas/carousel-schemas';


export async function generateCarousel(input: GenerateCarouselInput): Promise<GenerateCarouselOutput> {
  return generateCarouselFlow(input);
}


const generateCarouselFlow = ai.defineFlow(
  {
    name: 'generateCarouselFlow',
    inputSchema: GenerateCarouselInputSchema,
    outputSchema: GenerateCarouselOutputSchema,
  },
  async ({ baseImageUrl, concept, subjectPrompt }) => {
    
    // Le modèle ne supporte pas le mode JSON, nous retirons donc la demande de formatage JSON.
    // Nous allons demander une seule image améliorée et du texte, puis construire le carrousel.
    const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: baseImageUrl } },
            { text: `
                **Rôle :** Tu es un directeur artistique expert et un retoucheur photo.
                
                **Objectif :** En te basant sur l'image fournie, tu vas créer une histoire de transformation en 3 étapes sous forme de carrousel.

                **Instructions détaillées :**
                1.  **Analyse l'image de base.** Identifie sa nature (portrait, paysage, objet...) et son potentiel d'amélioration le plus pertinent et impactant. ${subjectPrompt ? `Le sujet principal est : ${subjectPrompt}.` : ''}
                2.  **Imagine la transformation :** Quelle est LA modification clé qui sublimerait cette image ? (Ex: améliorer l'éclairage d'un portrait, rendre un ciel plus dramatique, changer une ambiance de couleur, etc.).
                3.  **Génère une unique image "Après"** qui représente cette transformation de la manière la plus qualitative possible.
                4.  **Rédige 3 descriptions très courtes et percutantes** pour raconter cette histoire, une pour chaque étape du carrousel :
                    *   **Description 1 (Avant) :** Décris le point de départ, l'image originale.
                    *   **Description 2 (Pendant) :** Explique brièvement l'intention créative, la transformation que tu vas opérer.
                    *   **Description 3 (Après) :** Décris le résultat final, en mettant en valeur le bénéfice de la transformation.
            `},
        ],
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
        output: {
          format: "json",
          schema: GenerateCarouselOutputSchema,
        }
    });

    if (!output) {
      throw new Error("L'IA n'a pas pu générer le carrousel.");
    }
    
    // Le modèle ne retourne qu'une seule image (la version "Après") et 3 descriptions.
    // Nous construisons le carrousel en réutilisant l'image originale et la nouvelle.
    const finalImageUrl = output.slides[2].imageUrl;

    return {
        slides: [
            { imageUrl: baseImageUrl, description: output.slides[0].description },
            { imageUrl: finalImageUrl, description: output.slides[1].description },
            { imageUrl: finalImageUrl, description: output.slides[2].description },
        ]
    };
  }
);

    