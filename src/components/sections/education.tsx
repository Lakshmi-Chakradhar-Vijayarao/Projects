
"use client";

import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, MapPin, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

interface EducationEntry {
  degree: string;
  institution: string;
  duration: string;
  details: string;
  location: string;
  logoSrc?: string;
  logoAlt?: string;
  dataAiHint?: string;
  icon?: ReactNode; // For potential direct icon usage
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
    logoDisplayHeightClass: "h-6", 
  }
];

export default function Education() {
  return (
    <SectionWrapper id="education-section" title="Education">
      <div className="space-y-8">
        {educationData.map((edu, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50">
            <div className="flex items-start p-6 gap-4 sm:gap-6">
              {edu.logoSrc && (
                <div className={`relative ${edu.logoDisplayWidthClass || 'w-12'} ${edu.logoDisplayHeightClass || 'h-12'} flex-shrink-0 flex items-center justify-center`}>
                  <Image
                    src={edu.logoSrc}
                    alt={edu.logoAlt || edu.institution}
                    width={parseInt(edu.logoDisplayWidthClass?.substring(2) || '48') * 4} // Convert Tailwind units to approx pixels for intrinsic
                    height={parseInt(edu.logoDisplayHeightClass?.substring(2) || '48') * 4}
                    className="object-contain w-full h-full"
                    data-ai-hint={edu.dataAiHint}
                  />
                </div>
              )}
              {!edu.logoSrc && edu.icon && (
                <div className={`relative ${edu.logoDisplayWidthClass || 'w-12'} ${edu.logoDisplayHeightClass || 'h-12'} flex-shrink-0 flex items-center justify-center text-primary`}>
                   {React.cloneElement(edu.icon as React.ReactElement, { className: "w-full h-full" })}
                </div>
              )}
              <div className="flex-grow">
                <CardHeader className="p-0">
                  <CardTitle className="text-xl font-semibold text-primary flex items-center">
                    {/* <GraduationCap className="h-6 w-6 mr-3 text-secondary flex-shrink-0 hidden sm:inline-block" /> */}
                    {edu.degree}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">{edu.institution}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                      {edu.duration}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      {edu.location}
                    </div>
                  </div>
                  <p className="text-foreground/80 text-sm mt-3">{edu.details}</p>
                </CardContent>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
