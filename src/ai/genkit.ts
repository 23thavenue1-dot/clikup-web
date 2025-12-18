
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// La configuration est simplifiée. Le plugin googleAI() trouvera
// automatiquement la variable d'environnement GEMINI_API_KEY.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
