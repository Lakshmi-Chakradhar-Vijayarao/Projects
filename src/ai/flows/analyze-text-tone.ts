'use server';
/**
 * @fileOverview Analyzes the tone of a given text to ensure it conveys the right professional image.
 *
 * - analyzeTextTone - A function that analyzes the tone of the input text.
 * - AnalyzeTextToneInput - The input type for the analyzeTextTone function.
 * - AnalyzeTextToneOutput - The return type for the analyzeTextTone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTextToneInputSchema = z.object({
  text: z.string().describe('The text to analyze for tone.'),
});
export type AnalyzeTextToneInput = z.infer<typeof AnalyzeTextToneInputSchema>;

const AnalyzeTextToneOutputSchema = z.object({
  tone: z
    .string()
    .describe(
      'The analyzed tone of the text. Options include: confident, friendly, authoritative, formal, or informal.'
    ),
  explanation: z.string().describe('Explanation of why the tone was classified as such.'),
});
export type AnalyzeTextToneOutput = z.infer<typeof AnalyzeTextToneOutputSchema>;

export async function analyzeTextTone(input: AnalyzeTextToneInput): Promise<AnalyzeTextToneOutput> {
  return analyzeTextToneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTextTonePrompt',
  input: {schema: AnalyzeTextToneInputSchema},
  output: {schema: AnalyzeTextToneOutputSchema},
  prompt: `You are a professional tone analyzer. Analyze the tone of the following text and classify it as confident, friendly, authoritative, formal, or informal. Provide a brief explanation of why you classified it as such.\n\nText: {{{text}}}`,
});

const analyzeTextToneFlow = ai.defineFlow(
  {
    name: 'analyzeTextToneFlow',
    inputSchema: AnalyzeTextToneInputSchema,
    outputSchema: AnalyzeTextToneOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
