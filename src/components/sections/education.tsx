
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
}

const educationData: EducationEntry[] = [
  {
    degree: "Master of Science in Computer Science",
    institution: "The University of Texas at Dallas",
    duration: "Expected: May 2025",
    details: "GPA: 3.607 / 4.0",
    location: "Dallas, USA",
    logoSrc: "https://placehold.co/50x50.png", // Replace with /logos/utd-logo.png
    logoAlt: "University of Texas at Dallas Logo",
  },
  {
    degree: "Bachelor of Engineering in Electronics and Communication Engineering",
    institution: "R.M.K. Engineering College",
    duration: "Graduated: Mar 2023",
    details: "GPA: 9.04 / 10.0",
    location: "Chennai, India",
    logoSrc: "https://placehold.co/50x50.png", // Replace with /logos/rmk-logo.png
    logoAlt: "R.M.K. Engineering College Logo",
  }
];

export default function Education() {
  return (
    <SectionWrapper id="education-section" title="Education">
      <div className="space-y-8">
        {educationData.map((edu, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <GraduationCap className="h-7 w-7 mr-3 text-primary flex-shrink-0" />
                  <div>
                    <CardTitle className="text-xl font-semibold text-primary">{edu.degree}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">{edu.institution}</CardDescription>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Image
                    src={edu.logoSrc}
                    alt={edu.logoAlt}
                    width={48}
                    height={48}
                    objectFit="contain"
                    data-ai-hint={`${edu.institution.toLowerCase().replace(/[^a-z0-9]+/g, '-')} logo`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span>{edu.duration}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{edu.location}</span>
              </div>
              <p className="text-foreground/80">{edu.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
