'use server';
/**
 * @fileOverview Flow Genkit pour la génération de carrousels d'images en 4 étapes.
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
  async ({ baseImageUrl, subjectPrompt, userDirective, platform }) => {
    
    // --- APPEL 1: Génération de l'image "Après" ---
    const afterImageGeneration = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: baseImageUrl } },
            { text: `
                **Rôle :** Tu es un directeur artistique de renommée mondiale, spécialiste des portraits pour les magazines de mode.
                
                **Objectif :** Transformer ce portrait amateur en une photo de qualité studio professionnelle. La différence doit être spectaculaire.
                ${subjectPrompt ? `Le sujet principal est : ${subjectPrompt}.` : ''}

                **Instruction de transformation :** 
                ${userDirective 
                    ? `L'utilisateur a donné une directive claire : "${userDirective}". Ta transformation DOIT suivre cette instruction.`
                    : "Ta mission est de réaliser un 'glow-up' complet de ce portrait. 1. Modifie l'éclairage pour un rendu de studio flatteur et professionnel. 2. Optimise les couleurs pour que la peau soit radieuse (effet 'glowy') et les tons vibrants. 3. Lisse la peau pour unifier le teint tout en conservant une texture naturelle. 4. Accentue la netteté du regard pour le faire ressortir. Le résultat doit être visiblement optimisé."
                }
            `},
        ],
        config: {
            responseModalities: ['IMAGE'],
        },
    });

    if (!afterImageGeneration.media || !afterImageGeneration.media.url) {
      throw new Error("L'IA n'a pas pu générer l'image 'Après'.");
    }
    const afterImageUrl = afterImageGeneration.media.url;

    // --- APPEL 2: Génération des 4 descriptions textuelles ---
    const textGeneration = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `
            **Rôle :** Tu es un social media manager expert en storytelling pour ${platform}.
            **Objectif :** Rédige 4 descriptions très courtes et percutantes pour un carrousel "Avant/Après". Sépare chaque description par '---'.
            
            **Règle impérative :** Ne préfixe JAMAIS tes descriptions par "Texte 1", "Description 2", etc. Le ton doit être engageant et adapté à ${platform || 'un réseau social'}.
            
            **Contexte :**
            - Image Avant : Une photo de base.
            - Image Après : La même photo, mais améliorée et plus professionnelle.
            - Directive de l'utilisateur : "${userDirective || "Embellir le portrait pour un résultat professionnel et esthétique."}"
            
            **Descriptions à rédiger :**
            *   **Description 1 (Avant) :** Décris le point de départ, l'image originale. Sois factuel mais intriguant.
            *   **Description 2 (Pendant) :** Explique brièvement le défi créatif, la transformation qui va être opérée. Crée du suspense.
            *   **Description 3 (Après) :** Décris le résultat final, en mettant en valeur le bénéfice de la transformation. Utilise un ton enthousiaste.
            *   **Description 4 (Question) :** Rédige une question ouverte et engageante liée à l'image ou à la transformation, pour inciter les commentaires (style Instagram).
        `
    });

    if (!textGeneration.text) {
        throw new Error("L'IA n'a pas pu générer les textes du carrousel.");
    }

    const descriptions = textGeneration.text.split('---').map(d => d.replace(/^\*+ *(?:Description|Texte) \d+[^:]*:[ \n]*/i, '').trim());

    if (descriptions.length < 4) {
      throw new Error("L'IA n'a pas retourné les 4 descriptions attendues.");
    }
    
    // Pas de génération d'image pour les textes, on retourne null.
    // L'image sera construite côté client.
    return {
        slides: [
            { imageUrl: baseImageUrl, description: descriptions[0] },
            { imageUrl: null, description: descriptions[1] },
            { imageUrl: afterImageUrl, description: descriptions[2] }, 
            { imageUrl: null, description: descriptions[3] },
        ]
    };
  }
);
