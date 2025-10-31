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
  id: z.string().describe("The unique article reference (SKU), must be unique. Example: `ABC-1234`."),
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
  return generateArticlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFictitiousArticlesPrompt',
  input: {schema: GenerateFictitiousArticlesInputSchema},
  output: {schema: GenerateFictitiousArticlesOutputSchema},
  prompt: `You are a data generator for a Warehouse Management System (WMS) simulation. Your task is to create a realistic list of 20 fictitious articles for the following business sector: {{{sector}}}.

Each article must have a unique ID (SKU), a name, a warehouse location, an initial stock level, a price, and a packaging type.

Generate exactly 20 articles.
For warehouse locations, use a format like "A.1.1.A".
For stock, generate random integers between 10 and 500.
For packaging, use common logistics terms like 'PIEC', 'CARTON', 'BOTE', 'PAL'.
For the ID, generate a plausible but fictitious SKU.
`,
});


const generateArticlesFlow = ai.defineFlow(
  {
    name: 'generateArticlesFlow',
    inputSchema: GenerateFictitiousArticlesInputSchema,
    outputSchema: GenerateFictitiousArticlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
