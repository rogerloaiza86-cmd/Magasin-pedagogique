'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing suggestions for warehouse document verbiage and layout.
 *
 * The flow, documentGenerationAssistance, takes a description of a document and returns suggestions for its content and layout.
 * - documentGenerationAssistance - A function that suggests document verbiage and layout.
 * - DocumentGenerationAssistanceInput - The input type for the documentGenerationAssistance function.
 * - DocumentGenerationAssistanceOutput - The return type for the documentGenerationAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentGenerationAssistanceInputSchema = z.object({
  documentType: z.string().describe('The type of warehouse document (e.g., Bon de Commande Fournisseur, Bon de Livraison Client, Lettre de Voiture).'),
  documentDescription: z.string().describe('A description of the document and its purpose.'),
  relevantInformation: z.string().optional().describe('Any relevant information that should be included in the document.'),
});
export type DocumentGenerationAssistanceInput = z.infer<typeof DocumentGenerationAssistanceInputSchema>;

const DocumentGenerationAssistanceOutputSchema = z.object({
  suggestedVerbiage: z.string().describe('Suggestions for the verbiage to use in the document.'),
  suggestedLayout: z.string().describe('Suggestions for the layout of the document.'),
});
export type DocumentGenerationAssistanceOutput = z.infer<typeof DocumentGenerationAssistanceOutputSchema>;

export async function documentGenerationAssistance(input: DocumentGenerationAssistanceInput): Promise<DocumentGenerationAssistanceOutput> {
  return documentGenerationAssistanceFlow(input);
}

const documentGenerationAssistancePrompt = ai.definePrompt({
  name: 'documentGenerationAssistancePrompt',
  input: {schema: DocumentGenerationAssistanceInputSchema},
  output: {schema: DocumentGenerationAssistanceOutputSchema},
  prompt: `You are an expert in warehouse logistics and documentation. Your goal is to assist logistics students in creating professional-looking warehouse documents by providing suggestions for verbiage and layout.

  Document Type: {{{documentType}}}
  Document Description: {{{documentDescription}}}
  Relevant Information: {{{relevantInformation}}}

  Based on the document type, description, and any relevant information, suggest verbiage and layout for the document. Consider industry best practices and ensure the suggestions are clear, concise, and appropriate for the document's purpose.

  Format your response as follows:
  Suggested Verbiage: [Suggested verbiage for the document]
  Suggested Layout: [Suggested layout for the document]`,
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
