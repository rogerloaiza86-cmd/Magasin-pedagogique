'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing suggestions for warehouse document verbiage and layout,
 * specifically for generating a Lettre de Voiture (CMR) from an existing Bon de Livraison (BL).
 *
 * The flow, documentGenerationAssistance, takes a document ID and uses tools to fetch document details,
 * then generates a suggested CMR.
 * - documentGenerationAssistance - A function that suggests document verbiage and layout.
 * - DocumentGenerationAssistanceInput - The input type for the documentGenerationAssistance function.
 * - DocumentGenerationAssistanceOutput - The return type for the documentGenerationAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { WmsProvider, getInitialState } from '@/context/WmsContext'; // We need a way to access the state
import { Document, Tier, Article } from '@/lib/types';

// Let's create a simplified in-memory "database" for the AI to query.
// In a real app, this would query a real database.
const getWmsData = () => {
    // This is a simplified example. In a real-world scenario, you would fetch this from your actual state management/database.
    // For the purpose of this tool, we'll re-create the initial state. A better approach would be to have
    // a singleton or a shared state manager accessible by these server-side functions.
    const state = getInitialState();
    return {
        documents: state.documents,
        tiers: state.tiers,
        articles: state.articles,
    }
}


const getDocumentDetailsTool = ai.defineTool(
    {
        name: 'getDocumentDetails',
        description: 'Get the details of a specific warehouse document (like a Bon de Livraison).',
        inputSchema: z.object({ id: z.number() }),
        outputSchema: z.custom<Document>(),
    },
    async ({ id }) => {
        const { documents } = getWmsData();
        const doc = documents.get(id);
        if (!doc) {
            throw new Error(`Document with ID ${id} not found.`);
        }
        return doc;
    }
);

const getTierDetailsTool = ai.defineTool(
    {
        name: 'getTierDetails',
        description: "Get details for a tier (client, provider, transporter).",
        inputSchema: z.object({ id: z.number() }),
        outputSchema: z.custom<Tier>(),
    },
    async ({ id }) => {
        const { tiers } = getWmsData();
        const tier = tiers.get(id);
         if (!tier) {
            throw new Error(`Tier with ID ${id} not found.`);
        }
        return tier;
    }
);

const getArticleDetailsTool = ai.defineTool(
    {
        name: 'getArticleDetails',
        description: "Get details for a specific article (product).",
        inputSchema: z.object({ id: z.string() }),
        outputSchema: z.custom<Article>(),
    },
    async ({ id }) => {
       const { articles } = getWmsData();
       const article = articles.get(id);
        if (!article) {
           throw new Error(`Article with ID ${id} not found.`);
        }
        return article;
    }
);


const DocumentGenerationAssistanceInputSchema = z.object({
  documentId: z.number().describe("The ID of the source document (Bon de Livraison) to use for generating the Lettre de Voiture."),
});
export type DocumentGenerationAssistanceInput = z.infer<typeof DocumentGenerationAssistanceInputSchema>;

const DocumentGenerationAssistanceOutputSchema = z.object({
  suggestedVerbiage: z.string().describe('The full, suggested verbiage for the Lettre de Voiture document.'),
  suggestedLayout: z.string().describe('A description of the suggested layout for the document.'),
});
export type DocumentGenerationAssistanceOutput = z.infer<typeof DocumentGenerationAssistanceOutputSchema>;

export async function documentGenerationAssistance(input: DocumentGenerationAssistanceInput): Promise<DocumentGenerationAssistanceOutput> {
  return documentGenerationAssistanceFlow(input);
}

const documentGenerationAssistancePrompt = ai.definePrompt({
  name: 'documentGenerationAssistancePrompt',
  input: {schema: DocumentGenerationAssistanceInputSchema},
  output: {schema: DocumentGenerationAssistanceOutputSchema},
  tools: [getDocumentDetailsTool, getTierDetailsTool, getArticleDetailsTool],
  prompt: `You are an expert in warehouse logistics and documentation. Your goal is to assist logistics students by generating a professional Lettre de Voiture (CMR) based on a given Bon de Livraison (BL).

Use the available tools to fetch all necessary details about the BL, the client (destinataire), the transporter, and the articles.

Based on the retrieved information, generate the complete and appropriate verbiage for the Lettre de Voiture. Also, provide a suggestion for the document's layout.

The source Bon de Livraison ID is: {{{documentId}}}.`,
});

const documentGenerationAssistanceFlow = ai.defineFlow(
  {
    name: 'documentGenerationAssistanceFlow',
    inputSchema: DocumentGenerationAssistanceInputSchema,
    outputSchema: DocumentGenerationAssistanceOutputSchema,
  },
  async input => {
    const {output} = await documentGenerationAssistancePrompt(input);
    return output!;
  }
);
