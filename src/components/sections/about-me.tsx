import { SectionWrapper } from '@/components/ui/section-wrapper';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutMe() {
  return (
    <SectionWrapper id="about" title="About Me">
      <Card className="overflow-hidden shadow-xl">
        <div className="md:flex">
          <div className="md:w-1/3 md:shrink-0">
            <Image
              src="https://placehold.co/600x800.png"
              alt="Lakshmi Chakradhar Vijayarao"
              width={600}
              height={800}
              className="h-full w-full object-cover"
              data-ai-hint="professional portrait"
            />
          </div>
          <div className="md:w-2/3 p-8">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary">
                Hello, I'm Lakshmi!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mt-4 text-lg leading-relaxed text-foreground/80">
                I am a versatile Software Engineer and Machine Learning practitioner with proven experience delivering scalable, secure, and user-centric applications using Python, React.js, Node.js, and MySQL. 
              </p>
              <p className="mt-4 text-lg leading-relaxed text-foreground/80">
                Skilled at optimizing backend performance, implementing secure authentication, and developing AI-powered solutions with measurable outcomes. 
              </p>
              <p className="mt-4 text-lg leading-relaxed text-foreground/80">
                I'm a strong collaborator with expertise in Agile workflows, continuous learning, and cloud technologies (including AWS). My toolkit includes Python, YOLO, Scikit-learn, and I'm always eager to explore new challenges and technologies to build impactful solutions.
              </p>
            </CardContent>
          </div>
        </div>
      </Card>
    </SectionWrapper>
  );
}
