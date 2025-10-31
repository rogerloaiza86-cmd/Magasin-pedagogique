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
  // Bypassing the AI call and generating data directly with faker
  const articles = Array.from({ length: 20 }, () => {
    const id = `${faker.lorem.word().substring(0,3).toUpperCase()}-${faker.number.int({ min: 1000, max: 9999 })}`;
    const name = faker.commerce.productName();
    const location = `${faker.helpers.arrayElement(['A','B','C','D','E','F'])}.${faker.number.int({min:1, max:3})}.${faker.number.int({min:1, max:6})}.${faker.helpers.arrayElement(['A','B','C','D','E','F','G','H'])}`;
    const stock = faker.number.int({ min: 10, max: 500 });
    const price = parseFloat(faker.commerce.price({ min: 5, max: 200 }));
    const packaging = faker.helpers.arrayElement(['PIEC', 'CARTON', 'BOTE', 'PAL', 'KG']);
    
    return { id, name, location, stock, price, packaging };
  });

  return Promise.resolve({ articles });
}
