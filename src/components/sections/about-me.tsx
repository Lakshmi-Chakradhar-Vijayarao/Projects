
"use client";
import { SectionWrapper } from '@/components/ui/section-wrapper';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LockKeyhole, Zap, Cloud, Database, ScanEye, Leaf, Lightbulb, Activity } from 'lucide-react'; 

const keyHighlights = [
  { text: "OAuth2 & JWT Security", icon: <LockKeyhole className="h-5 w-5 text-primary" /> },
  { text: "Real-time AI Inference", icon: <Zap className="h-5 w-5 text-primary" /> },
  { text: "AWS & Databricks", icon: <Cloud className="h-5 w-5 text-primary" /> }, 
  { text: "Computer Vision (YOLO, OpenCV)", icon: <ScanEye className="h-5 w-5 text-primary" /> },
  { text: "Sustainable AI Solutions", icon: <Leaf className="h-5 w-5 text-primary" /> },
  { text: "Full-Stack Development", icon: <Lightbulb className="h-5 w-5 text-primary" /> }, 
];

export default function AboutMe() {
  return (
    <SectionWrapper id="about" title="About Me">
      <Card className="overflow-hidden shadow-xl bg-card/80 backdrop-blur-sm border border-border/50">
        <div className="md:flex">
          <div className="md:w-1/3 md:shrink-0 flex items-center justify-center p-4 md:p-0">
            <Image
              src="/chakradhar-portrait.jpg"
              alt="Lakshmi Chakradhar Vijayarao - Professional"
              width={600} // Assuming original image aspect ratio is somewhat square-ish or portrait
              height={600} // Adjust if your image is more rectangular
              className="h-auto w-full max-w-[300px] md:max-w-full md:h-full object-cover rounded-lg shadow-md"
              data-ai-hint="professional portrait"
              priority
            />
          </div>
          <div className="md:w-2/3 p-6 md:p-8">
            <CardHeader className="pb-4 px-0 md:px-2">
              <CardTitle className="text-3xl font-semibold text-primary">
                Lakshmi Chakradhar Vijayarao
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 md:px-2">
              <p className="mt-2 text-lg leading-relaxed text-foreground/90">
                I’m a passionate software engineer and AI developer with experience building secure, scalable web applications, ML systems, and cloud-based pipelines. With hands-on industry experience, I specialize in full-stack development, object detection, and intelligent data processing.
              </p>
              <h3 className="text-xl font-semibold text-primary mt-8 mb-4">Key Highlights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {keyHighlights.map((highlight) => (
                  <div key={highlight.text} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md border border-border/30 hover:shadow-md transition-shadow">
                    {highlight.icon}
                    <span className="text-foreground/80 text-sm">{highlight.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </SectionWrapper>
  );
}
