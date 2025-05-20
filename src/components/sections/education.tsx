
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, CalendarDays, MapPin } from 'lucide-react';
import Image from 'next/image';

interface EducationEntry {
  degree: string;
  institution: string;
  duration: string;
  details: string;
  location: string;
  logoSrc: string;
  logoAlt: string;
  dataAiHint: string;
}

const educationData: EducationEntry[] = [
  {
    degree: "Master of Science in Computer Science",
    institution: "The University of Texas at Dallas",
    duration: "Expected: May 2025",
    details: "GPA: 3.607 / 4.0",
    location: "Dallas, USA",
    logoSrc: "/logos/utd.png",
    logoAlt: "University of Texas at Dallas Logo",
    dataAiHint: "utd university",
  },
  {
    degree: "Bachelor of Engineering in Electronics and Communication Engineering",
    institution: "R.M.K. Engineering College",
    duration: "Graduated: Mar 2023",
    details: "GPA: 9.04 / 10.0",
    location: "Chennai, India",
    logoSrc: "/logos/rmk.png",
    logoAlt: "R.M.K. Engineering College Logo",
    dataAiHint: "rmk college",
  }
];

export default function Education() {
  return (
    <SectionWrapper id="education-section" title="Education">
      <div className="space-y-8">
        {educationData.map((edu, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                <div className="flex items-center">
                   <div className="flex-shrink-0 mr-4">
                    <Image
                      src={edu.logoSrc}
                      alt={edu.logoAlt}
                      width={48}
                      height={48}
                      objectFit="contain"
                      data-ai-hint={edu.dataAiHint}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-primary">{edu.degree}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">{edu.institution}</CardDescription>
                  </div>
                </div>
                 <div className="flex-shrink-0 self-start sm:self-center text-right">
                   <div className="flex items-center text-xs text-muted-foreground">
                     <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                     {edu.duration}
                   </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                     <MapPin className="h-3.5 w-3.5 mr-1.5" />
                     {edu.location}
                   </div>
                 </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">{edu.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
