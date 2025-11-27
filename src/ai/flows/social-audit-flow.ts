'use server';
/**
 * @fileOverview Flow Genkit pour l'audit de profil de réseau social par l'IA.
 *
 * - socialAuditFlow: La fonction principale qui prend les informations du profil et retourne un rapport d'audit.
 * - SocialAuditInput: Le type d'entrée pour la fonction.
 * - SocialAuditOutput: Le type de sortie pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SocialAuditInputSchema = z.object({
  platform: z.string().describe('La plateforme du réseau social (ex: Instagram, TikTok).'),
  goal: z.string().describe("L'objectif principal de l'utilisateur."),
  image_urls: z.array(z.string()).describe("Un tableau de data URIs des images sélectionnées pour l'analyse."),
  post_texts: z.array(z.string()).describe("Un tableau des textes de publications fournis par l'utilisateur."),
});
export type SocialAuditInput = z.infer<typeof SocialAuditInputSchema>;

export const SocialAuditOutputSchema = z.object({
  visual_identity: z.object({
    keywords: z.array(z.string()).describe("Une liste de 3-5 mots-clés qui décrivent le style visuel perçu."),
    summary: z.string().describe("Un court paragraphe résumant l'identité visuelle globale."),
  }),
  strategic_analysis: z.object({
    strengths: z.array(z.string()).describe("Une liste de 2-3 points forts du profil."),
    improvements: z.array(z.string()).describe("Une liste de 2-3 axes d'amélioration clairs et constructifs."),
  }),
  content_strategy: z.array(z.object({
    idea: z.string().describe("Une idée concrète de type de contenu à créer."),
    description: z.string().describe("Une brève explication de pourquoi cette idée est pertinente."),
  })).describe("Une liste de 3 suggestions de contenu."),
  action_plan: z.array(z.object({
    day: z.string().describe("Le jour du plan (ex: 'Jour 1', 'Jour 2')."),
    action: z.string().describe("L'action spécifique à réaliser ce jour-là."),
  })).describe("Un plan d'action simple sur 7 jours."),
});
export type SocialAuditOutput = z.infer<typeof SocialAuditOutputSchema>;

export async function socialAuditFlow(input: SocialAuditInput): Promise<SocialAuditOutput> {
    const { output } = await socialAuditPrompt(input);
    if (!output) {
        throw new Error("L'IA n'a pas pu générer de rapport d'audit.");
    }
    return output;
}

const socialAuditPrompt = ai.definePrompt({
    name: 'socialAuditPrompt',
    input: { schema: SocialAuditInputSchema },
    output: { schema: SocialAuditOutputSchema },
    prompt: `
        Tu es un coach expert en stratégie de contenu et en personal branding pour les réseaux sociaux. Ton ton est encourageant, professionnel et très actionnable.

        Un créateur de contenu te soumet son profil pour un audit. Voici ses informations :
        - Plateforme : {{platform}}
        - Son objectif principal : "{{goal}}"
        - Une sélection de ses publications visuelles :
        {{#each image_urls}}
        - {{media url=this}}
        {{/each}}
        - Exemples de ses textes de publication :
        {{#each post_texts}}
        - "{{this}}"
        {{/each}}

        En te basant UNIQUEMENT sur ces informations, fournis un rapport complet structuré précisément comme suit :

        1.  **visual_identity**: Analyse l'harmonie des couleurs, le style de composition, et l'ambiance générale. Résume cela en 3 à 5 mots-clés pertinents (ex: "minimaliste", "naturel", "contraste élevé") et un court paragraphe de synthèse.
        
        2.  **strategic_analysis**: Identifie 2 ou 3 points forts clairs (ce qui fonctionne déjà bien) et 2 ou 3 axes d'amélioration concrets et bienveillants. Sois constructif.
        
        3.  **content_strategy**: Propose 3 idées de contenu variées et spécifiques (ex: "Essayer un carrousel avant/après", "Faire une vidéo des coulisses de votre travail", "Créer un post tutoriel") qui sont directement liées à son objectif.
        
        4.  **action_plan**: Crée un plan d'action simple et motivant sur 7 jours. Chaque jour doit avoir une seule action concrète à réaliser pour commencer à appliquer tes conseils. Par exemple : "Jour 1: Mettre à jour votre biographie.", "Jour 2: Poster une photo en utilisant la règle des tiers."
    `,
});
