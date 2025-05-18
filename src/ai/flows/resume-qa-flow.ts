
'use server';
/**
 * @fileOverview A Genkit flow to answer questions about Chakradhar's resume.
 *
 * - askAboutResume - A function that takes a user's question and returns an AI-generated answer.
 * - ResumeQAInput - The input type for the askAboutResume function.
 * - ResumeQAOutput - The return type for the askAboutResume function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ResumeQAInputSchema = z.object({
  question: z.string().describe("The user's question about Chakradhar's resume."),
});
export type ResumeQAInput = z.infer<typeof ResumeQAInputSchema>;

const ResumeQAOutputSchema = z.object({
  answer: z.string().describe("The AI's answer based on Chakradhar's resume information."),
});
export type ResumeQAOutput = z.infer<typeof ResumeQAOutputSchema>;

// Hardcoded resume summary for context. In a more advanced setup, this could be retrieved dynamically or from a vector store.
const chakradharsResumeSummary = `
Versatile Software Engineer and Machine Learning practitioner with proven experience delivering scalable, secure, and user-centric applications using Python, React.js, Node.js, and MySQL. Skilled at optimizing backend performance, implementing secure authentication, and developing AI-powered solutions with measurable outcomes. Strong collaborator with expertise in Agile workflows, continuous learning, and cloud technologies.
Key Skills: Python, Java, JavaScript (ES6+), C++, C, C#, React.js, Node.js, Express.js, Django, Scikit-learn, YOLO, OpenCV, AWS (familiar), Docker (familiar), Git, Linux, CI/CD fundamentals, PySpark, Hadoop, Databricks, Pandas, NumPy, MySQL, PostgreSQL, Oracle, SQL, VS Code, Eclipse, REST APIs, Agile, Unit Testing, API Design, Cross-team Collaboration.
Experience includes:
- NSIC Technical Services Centre (Internship Project Trainee, Apr 2023 – Jun 2023): Constructed a responsive e-commerce platform (React.js, Node.js, MySQL), increasing user engagement by 20%. Implemented OAuth2 and JWT-based authentication, reducing session errors by 25%. Facilitated Android full-stack training.
- Zoho Corporation Private Limited (Summer Internship Project Associate, Mar 2022 – Apr 2022): Streamlined backend performance for a video conferencing application. Integrated WebRTC for 1,000+ real-time users.
Projects include: AI-Powered Smart Detection of Crops and Weeds, Search Engine for Movie Summaries, Facial Recognition Attendance System, Mushroom Classification using Scikit-Learn, Custom Process Scheduler Development.
Education: Master of Science in Computer Science from The University of Texas at Dallas (Expected: May 2025, GPA 3.607/4.0); Bachelor of Engineering in Electronics and Communication Engineering from R.M.K Engineering College (Mar 2023, GPA 9.04/10.0).
Certifications: IBM DevOps and Software Engineering, Microsoft Full-Stack Developer, Meta Back-End Developer, AWS Certified Cloud Practitioner.
Publication: TEXT DETECTION BASED ON DEEP LEARNING, presented at IEEE’s International Conference on Intelligent Data Communication and Analytics.
`;

const resumeQAPrompt = ai.definePrompt({
  name: 'resumeQAPrompt',
  input: { schema: ResumeQAInputSchema },
  output: { schema: ResumeQAOutputSchema },
  prompt: `You are a helpful AI assistant for Chakradhar Vijayarao's portfolio. Your role is to answer the user's question based *only* on the following information about Chakradhar.
If the question cannot be answered from this information, politely state that you don't have that specific detail. Do not make up information or answer questions outside of this resume context. Keep answers concise and professional.

Chakradhar's Resume Information:
---
${chakradharsResumeSummary}
---

User's Question: {{{question}}}
Answer:
`,
});

const resumeQAFlow = ai.defineFlow(
  {
    name: 'resumeQAFlow',
    inputSchema: ResumeQAInputSchema,
    outputSchema: ResumeQAOutputSchema,
  },
  async (input) => {
    const { output } = await resumeQAPrompt(input);
    if (!output) {
      // Fallback if the model returns nothing, though the schema should guide it.
      return { answer: "I'm sorry, I couldn't generate a response for that. Could you try rephrasing?" };
    }
    return output;
  }
);

export async function askAboutResume(input: ResumeQAInput): Promise<ResumeQAOutput> {
  return resumeQAFlow(input);
}
