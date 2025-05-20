
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
  logoSrc: string;
  logoAlt: string;
  dataAiHint: string;
  logoWidth: number;
  logoHeight: number;
}

const certificationsData: Certification[] = [
  {
    name: "IBM DevOps and Software Engineering Professional Certificate",
    issuer: "IBM",
    url: "#", // Replace with actual URL
    logoSrc: "/logos/ibm.png",
    logoAlt: "IBM Logo",
    dataAiHint: "ibm",
    logoWidth: 200, 
    logoHeight: 80, 
  },
  {
    name: "Microsoft Full-Stack Developer Professional Certificate",
    issuer: "Microsoft",
    url: "#", // Replace with actual URL
    logoSrc: "/logos/microsoft.png",
    logoAlt: "Microsoft Logo",
    dataAiHint: "microsoft",
    logoWidth: 300, 
    logoHeight: 64,  
  },
  {
    name: "Meta Back-End Developer Professional Certificate",
    issuer: "Meta",
    url: "#", // Replace with actual URL
    logoSrc: "/logos/meta.png",
    logoAlt: "Meta Logo",
    dataAiHint: "meta",
    logoWidth: 200, 
    logoHeight: 80,  
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "AWS Academy",
    url: "#", // Replace with actual URL
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
              {/* Increased height of logo container from h-14 to h-16 */}
              <div className="mb-4 flex items-center justify-center h-16 w-full"> 
                <Image
                  src={cert.logoSrc}
                  alt={cert.logoAlt}
                  width={cert.logoWidth}
                  height={cert.logoHeight}
                  className="max-h-full max-w-full object-contain"
                  data-ai-hint={cert.dataAiHint}
                />
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
