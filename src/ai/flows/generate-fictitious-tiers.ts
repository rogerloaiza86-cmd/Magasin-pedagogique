
'use server';

/**
 * @fileOverview A Genkit flow to generate fictitious tiers (clients, fournisseurs, etc.) for a given business sector.
 *
 * - generateFictitiousTiers - A function that generates a list of tiers.
 * - GenerateFictitiousTiersInput - The input type for the function.
 * - GenerateFictitiousTiersOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { TierType } from '@/lib/types';

const GenerateFictitiousTiersInputSchema = z.object({
  sector: z.string().describe('The business sector for which to generate tiers (e.g., "Pièces détachées automobile").'),
  type: z.string().describe('The type of tier to generate (Client, Fournisseur, Transporteur).'),
});
export type GenerateFictitiousTiersInput = z.infer<typeof GenerateFictitiousTiersInputSchema>;

const TierSchema = z.object({
  name: z.string().describe('The name of the company.'),
  address: z.string().describe('A plausible full address for the company in France.'),
  email: z.string().email().describe('A plausible email address for the company.'),
});

const GenerateFictitiousTiersOutputSchema = z.object({
  tiers: z.array(TierSchema).length(5).describe('An array of 5 fictitious tiers.'),
});

export type GenerateFictitiousTiersOutput = z.infer<typeof GenerateFictitiousTiersOutputSchema>;

export async function generateFictitiousTiers(input: GenerateFictitiousTiersInput): Promise<GenerateFictitiousTiersOutput> {
  return generateFictitiousTiersFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateFictitiousTiersPrompt',
  input: {schema: GenerateFictitiousTiersInputSchema},
  output: {schema: GenerateFictitiousTiersOutputSchema},
  prompt: `You are a French business data generation expert. Your goal is to create a realistic and coherent set of 5 tiers of type '{{{type}}}' for a given business sector.

For each tier, you must generate:
- A plausible French company name.
- A realistic full French address (street, city, postal code).
- A professional-looking email address.

Business sector: {{{sector}}}
Tier type: {{{type}}}`,
});

const generateFictitiousTiersFlow = ai.defineFlow(
  {
    name: 'generateFictitiousTiersFlow',
    inputSchema: GenerateFictitiousTiersInputSchema,
    outputSchema: GenerateFictitiousTiersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
