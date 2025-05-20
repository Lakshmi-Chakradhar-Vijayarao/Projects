'use server';
/**
 * @fileOverview A resume Q&A AI agent for Chakradhar Vijayarao.
 *
 * - askAboutResume - A function that answers questions based on Chakradhar's resume summary.
 * - ResumeQAInput - The input type for the askAboutResume function.
 * - ResumeQAOutput - The return type for the askAboutResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResumeQAInputSchema = z.object({
  question: z.string().describe("The user's question about Chakradhar's resume."),
});
export type ResumeQAInput = z.infer<typeof ResumeQAInputSchema>;

const ResumeQAOutputSchema = z.object({
  answer: z.string().describe("The AI's answer based on Chakradhar's resume information."),
});
export type ResumeQAOutput = z.infer<typeof ResumeQAOutputSchema>;

const chakradharsProfessionalSummary = `Versatile Software Engineer and Machine Learning practitioner with proven experience delivering scalable, secure, and user-centric applications using Python, React.js, Node.js, and MySQL. Skilled at optimizing backend performance, implementing secure authentication, and developing AI-powered solutions with measurable outcomes. Strong collaborator with expertise in Agile workflows, continuous learning, and cloud technologies.`;

export async function askAboutResume(input: ResumeQAInput): Promise<ResumeQAOutput> {
  return resumeQAFlow(input);
}

const resumeQAPrompt = ai.definePrompt({
  name: 'resumeQAPrompt',
  input: {schema: ResumeQAInputSchema},
  output: {schema: ResumeQAOutputSchema},
  prompt: `You are a helpful and professional AI assistant for Chakradhar Vijayarao's portfolio. 
  Your role is to answer questions based *only* on the provided resume summary information about Chakradhar. 
  If a question cannot be answered using only this information, politely state that the information is not available in the summary.
  Do not make up information or answer questions outside of this context. Keep answers concise and professional.

  Resume Information for Chakradhar Vijayarao:
  "${chakradharsProfessionalSummary}"

  User's Question: {{{question}}}
  
  Answer:`,
});

const resumeQAFlow = ai.defineFlow(
  {
    name: 'resumeQAFlow',
    inputSchema: ResumeQAInputSchema,
    outputSchema: ResumeQAOutputSchema,
  },
  async (input) => {
    const {output} = await resumeQAPrompt(input);
    if (!output) {
        return { answer: "I'm sorry, I couldn't generate a response at this moment." };
    }
    return output;
  }
);
