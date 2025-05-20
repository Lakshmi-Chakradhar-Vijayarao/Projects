
'use server';
/**
 * @fileOverview A resume Q&A AI agent for Chakradhar Vijayarao.
 *
 * - askAboutResume - A function that answers questions based on Chakradhar's resume.
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

const chakradharsFullResumeText = `
Lakshmi Chakradhar Vijayarao
lakshmichakradhar.v@gmail.com | LinkedIn | Git | Ph: +1 (469)-783-4637

PROFESSIONAL SUMMARY
Versatile Software Engineer and Machine Learning practitioner with proven experience delivering scalable, secure, and user-centric applications using Python, React.js, Node.js, and MySQL. Skilled at optimizing backend performance, implementing secure authentication, and developing AI-powered solutions with measurable outcomes. Strong collaborator with expertise in Agile workflows, continuous learning, and cloud technologies.

EDUCATION
The University of Texas at Dallas, Dallas, USA
Master of Science, Computer Science
Expected: May 2025
GPA 3.607/4.0

R.M.K Engineering College, Chennai, India
Bachelor of Engineering, Electronics and Communication Engineering
Graduated: Mar 2023
GPA 9.04/10.0

TECHNICAL SKILLS
Programming Languages: Python, Java, JavaScript (ES6+), C++, C, C#
Frameworks & Libraries: React.js, Node.js, Express.js, Django, Scikit-learn, YOLO, OpenCV
Cloud & DevOps Concepts: AWS (familiar), Docker (familiar), Git, Linux, CI/CD fundamentals
Data & Big Data: PySpark, Hadoop, Databricks, Pandas, NumPy
Databases: MySQL, PostgreSQL, Oracle, SQL
Tools: Git, VS Code, Eclipse, REST APIs
Methodologies: Agile, Unit Testing, API Design, Cross-team Collaboration

EXPERIENCE
NSIC TECHNICAL SERVICES CENTRE Chennai, India
Internship Project trainee
Apr 2023 – Jun 2023
   • Constructed a responsive e-commerce platform using React.js, Node.js, and MySQL, increasing user engagement by 20%.
   • Implemented OAuth2 and JWT-based authentication, reducing session errors by 25% and enhancing login reliability.
   • Facilitated Android full-stack training for 30+ students, achieving a 95% pass rate and boosting job placement outcomes by 40%.

ZOHO CORPORATION PRIVATE LIMITED Chennai, India
Summer Internship Project Associate
Mar 2022 – Apr 2022
   • Streamlined backend performance by refining API calls and optimizing SQL queries in a video conferencing application.
   • Integrated WebRTC for low-latency communication, enhancing real-time interaction for 1,000+ concurrent users.
   • Partnered with QA and product teams in Agile sprints to release reliable, scalable features.

PROJECTS
AI-Powered Smart Detection of Crops and Weeds for Sustainable Agriculture (Python, YOLO, Object Detection)
   • Built a YOLO-based object detection model with 90% accuracy for classifying crop and weed species, reducing herbicide usage by 15%.
   • Processed 10,000+ agricultural images and established scalable inference pipelines for real-time analysis.

Search Engine for Movie Summaries (Python, PySpark, Databricks, Scala, Hadoop)
   • Developed a distributed search engine leveraging TF-IDF and cosine similarity to improve query relevance by 10%.
   • Deployed on Hadoop and Databricks to manage 100,000+ records efficiently.

Facial Recognition Attendance System (Python, OpenCV, Machine Learning)
   • Designed a facial recognition system with 99% accuracy for 200+ users, reducing attendance tracking errors by 30%.
   • Linked to cloud storage for real-time data syncing and secure logging.

Scikit-Learn and Cross Validation for Mushroom Classification (Python, Scikit-Learn, DT Classifier, RF Classifier, KNN Classifier)
   • Trained and evaluated ensemble models (Decision Tree, Random Forest, KNN), achieving 95% accuracy using cross-validation.
   • Enhanced reliability through preprocessing techniques to address 20% missing data.

Custom Process Scheduler Development (Linux Kernel, xv6, C, C++)
   • Programmed custom priority and lottery schedulers, reducing context switching overhead by 18%.
   • Validated algorithm fairness and efficiency with synthetic workload simulations.

CERTIFICATIONS
• IBM DevOps and Software Engineering Professional Certificate
• Microsoft Full-Stack Developer Professional Certificate
• Meta Back-End Developer Professional Certificate
• AWS Certified CLOUD PRACTITIONER - AWS Academy

PUBLICATION
TEXT DETECTION BASED ON DEEP LEARNING
   • Built a handwriting recognition model using MNIST-style data, achieving 98.6% training precision and 96.9% test accuracy.
   • Presented findings at IEEE’s International Conference on Intelligent Data Communication and Analytics.

ADDITIONAL INFORMATION
• Proficient with Git, RESTful API design, and Linux-based development environments.
• Experienced in Agile collaboration, sprint execution, and cross-functional teamwork.
• Strong foundation in Java programming, including object-oriented design and multithreading concepts.
• Practical knowledge of machine learning algorithms, data preprocessing, and model evaluation techniques.
• Comfortable working with ML libraries such as Scikit-learn and frameworks like YOLO for computer vision applications.
`;

export async function askAboutResume(input: ResumeQAInput): Promise<ResumeQAOutput> {
  return resumeQAFlow(input);
}

// The input to the prompt itself includes the question and the static full resume text
const PromptInputSchema = z.object({
  question: ResumeQAInputSchema.shape.question, // Re-use the question part of the flow's input schema
  fullResumeText: z.string().describe("The complete text of Chakradhar's resume."),
});

const resumeQAPrompt = ai.definePrompt({
  name: 'resumeQAPrompt',
  input: { schema: PromptInputSchema }, // Use the new combined schema for the prompt
  output: { schema: ResumeQAOutputSchema },
  prompt: `You are a helpful and professional AI assistant for Chakradhar Vijayarao's portfolio.
  Your role is to answer questions based *only* on the provided full resume information about Chakradhar.
  If a question cannot be answered using only this information, politely state that the information is not available in the resume.
  Do not make up information or answer questions outside of this context. Keep answers concise and professional.

  Full Resume Information for Chakradhar Vijayarao:
  {{{fullResumeText}}}

  User's Question: {{{question}}}

  Answer:`,
});

const resumeQAFlow = ai.defineFlow(
  {
    name: 'resumeQAFlow',
    inputSchema: ResumeQAInputSchema, // The flow's public input is still just the question
    outputSchema: ResumeQAOutputSchema,
  },
  async (input) => {
    const { output } = await resumeQAPrompt({
      question: input.question,
      fullResumeText: chakradharsFullResumeText, // Inject the full resume text here
    });
    if (!output) {
        return { answer: "I'm sorry, I couldn't generate a response at this moment." };
    }
    return output;
  }
);
