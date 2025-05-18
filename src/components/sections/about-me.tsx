import { SectionWrapper } from '@/components/ui/section-wrapper';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutMe() {
  return (
    <SectionWrapper id="about" title="About Me">
      <Card className="overflow-hidden shadow-xl bg-card/80 backdrop-blur-sm">
        <div className="md:flex">
          <div className="md:w-1/3 md:shrink-0">
            <Image
              src="https://placehold.co/600x800.png"
              alt="Lakshmi Chakradhar Vijayarao - Professional"
              width={600}
              height={800}
              className="h-full w-full object-cover"
              data-ai-hint="professional portrait"
            />
          </div>
          <div className="md:w-2/3 p-8">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-primary">
                Hello, I'm Lakshmi!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mt-4 text-lg leading-relaxed text-foreground/90">
                I am a versatile Software Engineer and Machine Learning practitioner with skills in full stack development, machine learning, and scalable real-time systems.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-foreground/90">
                I have proven experience delivering user-centric applications and AI-powered solutions using Python, YOLO, Scikit-learn, and AWS. My passion lies in building impactful software that solves real-world problems.
              </p>
               <p className="mt-4 text-lg leading-relaxed text-foreground/90">
                With a strong foundation in computer science and a keen interest in emerging technologies, I continuously strive to expand my knowledge and apply innovative approaches to software development and machine learning challenges.
              </p>
            </CardContent>
          </div>
        </div>
      </Card>
    </SectionWrapper>
  );
}
