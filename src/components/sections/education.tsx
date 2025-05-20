
"use client";

import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, MapPin, GraduationCap } from 'lucide-react';
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
  logoDisplayWidthClass?: string;
  logoDisplayHeightClass?: string;
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
    logoDisplayWidthClass: "w-12", 
    logoDisplayHeightClass: "h-12",
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
    logoDisplayWidthClass: "w-16", 
    logoDisplayHeightClass: "h-14", 
  }
];

export default function Education() {
  return (
    <SectionWrapper id="education-section" title="Education">
      <div className="space-y-8">
        {educationData.map((edu, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm border border-border/50">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className={`relative ${edu.logoDisplayWidthClass || 'w-12'} ${edu.logoDisplayHeightClass || 'h-12'} flex-shrink-0 flex items-center justify-center mr-2`}>
                  {edu.logoSrc && (
                    <Image
                      src={edu.logoSrc}
                      alt={edu.logoAlt}
                      width={100} // Intrinsic width for next/image, actual display controlled by container
                      height={100} // Intrinsic height
                      className="object-contain w-full h-full"
                      data-ai-hint={edu.dataAiHint}
                    />
                  )}
                </div>
                <div className="flex-grow">
                  <CardTitle className="text-xl font-semibold text-primary flex items-center">
                    <GraduationCap className="h-6 w-6 mr-3 text-secondary flex-shrink-0" />
                    {edu.degree}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-1 ml-9">{edu.institution}</CardDescription>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground ml-9">
                    <div className="flex items-center">
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                      {edu.duration}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      {edu.location}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pl-[calc(3rem+1.5rem)]"> {/* Adjust based on the largest logo container width + gap if needed */}
              <p className="text-foreground/80 text-sm">{edu.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
