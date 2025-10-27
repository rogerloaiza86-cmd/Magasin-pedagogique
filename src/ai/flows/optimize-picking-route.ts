'use server';

/**
 * @fileOverview A picking route optimization AI agent.
 *
 * - optimizePickingRoute - A function that optimizes the picking route based on item locations.
 * - OptimizePickingRouteInput - The input type for the optimizePickingRoute function.
 * - OptimizePickingRouteOutput - The return type for the optimizePickingRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizePickingRouteInputSchema = z.object({
  items: z
    .array(
      z.object({
        ID_Article: z.string().describe('The ID of the article to pick.'),
        Designation: z.string().describe('The designation of the article.'),
        Emplacement: z.string().describe('The location of the article in the warehouse.'),
        Quantite: z.number().describe('The quantity of the article to pick.'),
      })
    )
    .describe('A list of items to pick with their locations and quantities.'),
});
export type OptimizePickingRouteInput = z.infer<typeof OptimizePickingRouteInputSchema>;

const OptimizePickingRouteOutputSchema = z.object({
  optimizedRoute: z
    .array(
      z.object({
        ID_Article: z.string().describe('The ID of the article to pick.'),
        Designation: z.string().describe('The designation of the article.'),
        Emplacement: z.string().describe('The location of the article in the warehouse.'),
        Quantite: z.number().describe('The quantity of the article to pick.'),
      })
    )
    .describe('The optimized picking route, ordered by location to minimize travel time.'),
});
export type OptimizePickingRouteOutput = z.infer<typeof OptimizePickingRouteOutputSchema>;

export async function optimizePickingRoute(input: OptimizePickingRouteInput): Promise<OptimizePickingRouteOutput> {
  return optimizePickingRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizePickingRoutePrompt',
  input: {schema: OptimizePickingRouteInputSchema},
  output: {schema: OptimizePickingRouteOutputSchema},
  prompt: `You are a warehouse logistics expert. Optimize the following picking route to minimize travel time within the warehouse. Consider the Emplacement (location) of each item when determining the optimal order. The goal is to create a picking route that reduces the distance traveled by the picker.

Items to pick:
{{#each items}}
- ID: {{ID_Article}}, Designation: {{Designation}}, Location: {{Emplacement}}, Quantity: {{Quantite}}
{{/each}}

Return the optimized route in the same format as the input, but ordered by the optimal picking sequence. Focus on optimizing the Emplacement order.

Optimized Route: {
  "optimizedRoute": [
    {{#each items}}
    {
      "ID_Article": "{{ID_Article}}",
      "Designation": "{{Designation}}",
      "Emplacement": "{{Emplacement}}",
      "Quantite": {{Quantite}}
    }}{{#unless @last}},{{/unless}}
    {{/each}}
  ]
}
`,
});

const optimizePickingRouteFlow = ai.defineFlow(
  {
    name: 'optimizePickingRouteFlow',
    inputSchema: OptimizePickingRouteInputSchema,
    outputSchema: OptimizePickingRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
