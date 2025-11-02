'use server';

/**
 * @fileOverview A Genkit flow to generate fictitious articles for a given business sector.
 *
 * - generateFictitiousArticles - A function that generates a list of articles.
 * - GenerateFictitiousArticlesInput - The input type for the function.
 * - GenerateFictitiousArticlesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {faker} from '@faker-js/faker/locale/fr';

const GenerateFictitiousArticlesInputSchema = z.object({
  sector: z.string().describe('The business sector for which to generate articles (e.g., "Mode, Habillement et Chaussures").'),
});
export type GenerateFictitiousArticlesInput = z.infer<typeof GenerateFictitiousArticlesInputSchema>;

const ArticleSchema = z.object({
  id: z.string().describe("The unique article reference (SKU), must be unique and short. Example: `ABC-1234`."),
  name: z.string().describe('The name or designation of the article. Example: "T-shirt Coton Bio"'),
  location: z.string().describe("The warehouse location in the format A.1.1.A"),
  stock: z.number().describe('The initial stock quantity.'),
  price: z.number().describe('The unit price before tax.'),
  packaging: z.string().describe('The packaging unit. Example: "PIEC", "BOTE", "CARTON"'),
});

const GenerateFictitiousArticlesOutputSchema = z.object({
  articles: z.array(ArticleSchema).length(20).describe('An array of 20 fictitious articles.'),
});

export type GenerateFictitiousArticlesOutput = z.infer<typeof GenerateFictitiousArticlesOutputSchema>;


export async function generateFictitiousArticles(input: GenerateFictitiousArticlesInput): Promise<GenerateFictitiousArticlesOutput> {
  return generateFictitiousArticlesFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateFictitiousArticlesPrompt',
  input: {schema: GenerateFictitiousArticlesInputSchema},
  output: {schema: GenerateFictitiousArticlesOutputSchema},
  prompt: `You are a warehouse data generation expert. Your goal is to create a realistic and coherent set of 20 articles for a given business sector.

For each article, you must generate:
- A unique and realistic ID (SKU).
- A plausible name.
- A random but valid-looking warehouse location in the format A.1.1.A (A-F).(1-3).(1-6).(A-H).
- A realistic initial stock level.
- A logical unit price.
- A packaging unit (e.g., PIEC, CARTON, BOTE, PAL, KG).

Business sector: {{{sector}}}`,
});

const generateFictitiousArticlesFlow = ai.defineFlow(
  {
    name: 'generateFictitiousArticlesFlow',
    inputSchema: GenerateFictitiousArticlesInputSchema,
    outputSchema: GenerateFictitiousArticlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);