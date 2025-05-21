"use client";
import type { ReactNode } from 'react';
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Certification {
  name: string;
  issuer: string;
  url: string;
  icon?: ReactNode; // Optional: for direct SVG rendering if needed
  logoSrc?: string; // For next/image
  logoAlt?: string;
  dataAiHint?: string;
  logoWidth?: number;
  logoHeight?: number;
}

const certificationsData: Certification[] = [
  {
    name: "IBM DevOps and Software Engineering Professional Certificate",
    issuer: "IBM",
    url: "#", 
    icon: null,
    logoSrc: "/logos/ibm.png",
    logoAlt: "IBM Logo",
    dataAiHint: "ibm",
    logoWidth: 216, // Increased from 200
    logoHeight: 80, 
  },
  {
    name: "Microsoft Full-Stack Developer Professional Certificate",
    issuer: "Microsoft",
    url: "#", 
    icon: null,
    logoSrc: "/logos/microsoft.png",
    logoAlt: "Microsoft Logo",
    dataAiHint: "microsoft",
    logoWidth: 300, 
    logoHeight: 64,  
  },
  {
    name: "Meta Back-End Developer Professional Certificate",
    issuer: "Meta",
    url: "#", 
    icon: null,
    logoSrc: "/logos/meta.png",
    logoAlt: "Meta Logo",
    dataAiHint: "meta",
    logoWidth: 216, // Increased from 200
    logoHeight: 80,  
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "AWS Academy",
    url: "#", 
    icon: null,
    logoSrc: "/logos/aws.png",
    logoAlt: "AWS Logo",
    dataAiHint: "aws",
    logoWidth: 125, 
    logoHeight: 75,  
  }
];

export default function Certifications() {
  return (
    <SectionWrapper id="certifications-section" title="Certifications">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {certificationsData.map((cert, index) => (
          <Link
            key={index}
            href={cert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group h-full"
            aria-label={`View certification: ${cert.name}`}
          >
            <Card className="h-full flex flex-col items-center text-center p-6 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50">
              <div className="mb-4 flex items-center justify-center w-full h-24"> {/* Increased container height for logos */}
                {cert.icon ? (
                  cert.icon
                ) : cert.logoSrc && cert.logoAlt && cert.dataAiHint && cert.logoWidth && cert.logoHeight ? (
                  <Image
                    src={cert.logoSrc}
                    alt={cert.logoAlt}
                    width={cert.logoWidth} 
                    height={cert.logoHeight}
                    className="max-h-full max-w-full object-contain" // Ensures logo fits and maintains aspect ratio
                    data-ai-hint={cert.dataAiHint}
                  />
                ) : (
                   <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
                   </div>
                )}
              </div>
              <CardHeader className="p-0 mb-2 flex-shrink-0 min-h-[3em]">
                <CardTitle className="text-base md:text-lg font-semibold text-primary group-hover:text-accent transition-colors leading-tight">
                  {cert.name}
                </CardTitle>
              </CardHeader>
              <CardDescription className="text-muted-foreground text-sm mt-1">{cert.issuer}</CardDescription>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}