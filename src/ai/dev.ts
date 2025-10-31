
'use server';
import { config } from 'dotenv';
config();

// This must be imported before any other flows are.
import '@/ai/genkit';

import '@/ai/flows/optimize-picking-route.ts';
import '@/ai/flows/document-generation-assistance.ts';
import '@/ai/flows/generate-articles-flow.ts';
