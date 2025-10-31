'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/optimize-picking-route.ts';
import '@/ai/flows/document-generation-assistance.ts';
import '@/ai/flows/generate-articles-flow.ts';
