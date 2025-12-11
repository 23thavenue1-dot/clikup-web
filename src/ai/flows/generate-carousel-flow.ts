
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
  async ({ baseImageUrl, subjectPrompt, userDirective }) => {
    
    // --- APPEL 1: Génération de l'image "Après" ---
    const afterImageGeneration = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: baseImageUrl } },
            { text: `
                **Rôle :** Tu es un directeur artistique expert, un retoucheur photo.
                
                **Objectif :** En te basant sur l'image fournie, tu vas générer une unique image "Après" qui représente une transformation.
                ${subjectPrompt ? `Le sujet principal est : ${subjectPrompt}.` : ''}

                **Instruction de transformation :** 
                ${userDirective 
                    ? `L'utilisateur a donné une directive claire : "${userDirective}". Ta transformation DOIT suivre cette instruction.`
                    : "Ta mission est d'embellir ce portrait. Apporte plus de lumière, rehausse les couleurs pour un éclat naturel et vibrant, améliore la netteté du regard et lisse subtilement la peau pour un résultat professionnel et esthétique."
                }
                
                Le résultat doit être visiblement optimisé.
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
            **Rôle :** Tu es un social media manager expert en storytelling.
            **Objectif :** Rédige 4 descriptions très courtes et percutantes pour un carrousel "Avant/Après". Sépare chaque description par '---'.
            
            **Règle impérative :** Ne préfixe JAMAIS tes descriptions par "Texte 1", "Texte 2", etc.
            
            **Contexte :**
            - Image Avant : Une photo de base.
            - Image Après : La même photo, mais améliorée et plus professionnelle.
            
            **Descriptions à rédiger :**
            *   **Description 1 (Avant) :** Décris le point de départ, l'image originale.
            *   **Description 2 (Pendant) :** Explique brièvement le défi créatif, la transformation qui va être opérée.
            *   **Description 3 (Après) :** Décris le résultat final, en mettant en valeur le bénéfice de la transformation.
            *   **Description 4 (Question) :** Rédige une question ouverte et engageante liée à l'image ou à la transformation, pour inciter les commentaires.
        `
    });

    if (!textGeneration.text) {
        throw new Error("L'IA n'a pas pu générer les descriptions du carrousel.");
    }
    
    // Nettoyer les descriptions pour enlever les préfixes potentiels (ex: "**Texte 2:**")
    const descriptions = textGeneration.text.split('---').map(d => d.replace(/^\*+Texte\s\d+\s?\**[:\s]*/i, '').trim());
    if (descriptions.length < 4) {
      throw new Error("L'IA n'a pas retourné les 4 descriptions attendues.");
    }
    

    // --- APPEL 3: Génération de l'image "Pendant" ---
    const duringGeneration = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `Crée une image conceptuelle et stylisée qui représente l'idée de "transformation créative" ou de "processus d'amélioration". Le style doit être graphique et moderne, avec des éléments comme des lignes d'énergie, des particules de lumière, ou des formes abstraites qui évoquent le changement. L'image doit être visuellement intéressante mais pas trop chargée, pour accompagner le texte : "${descriptions[1]}"`,
        config: { aspectRatio: '3:4' }
    });

    if (!duringGeneration.media || !duringGeneration.media.url) {
        throw new Error("L'IA n'a pas pu générer l'image 'Pendant'.");
    }
    const duringImageUrl = duringGeneration.media.url;


    // --- APPEL 4: Génération de l'image "Question" ---
    const questionGeneration = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `Crée une image graphique simple et élégante pour un post de réseau social. Au centre, sur un fond texturé subtil (comme du papier ou un mur de couleur neutre), écris en grosses lettres lisibles et stylées le texte suivant : "${descriptions[3]}"`,
        config: { aspectRatio: '3:4' }
    });

    if (!questionGeneration.media || !questionGeneration.media.url) {
        throw new Error("L'IA n'a pas pu générer l'image 'Question'.");
    }
    const questionImageUrl = questionGeneration.media.url;

    return {
        slides: [
            { imageUrl: baseImageUrl, description: descriptions[0] },
            { imageUrl: duringImageUrl, description: descriptions[1] },
            { imageUrl: afterImageUrl, description: descriptions[2] }, 
            { imageUrl: questionImageUrl, description: descriptions[3] },
        ]
    };
  }
);
