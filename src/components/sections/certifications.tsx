
"use client";

import type { ReactNode } from 'react';
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Define SVG components for IBM and Meta
const IbmLogo = () => (
  <svg viewBox="0 0 72 28" fill="currentColor" className="text-primary h-5 w-auto" xmlns="http://www.w3.org/2000/svg">
    {/* 8 horizontal bars to represent IBM logo style */}
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} y={i * 3.5} width="72" height="2.5" />
    ))}
  </svg>
);

const MetaLogo = () => (
  <svg viewBox="0 0 32 16" fill="currentColor" className="text-primary h-6 w-auto" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.21.03c-1.87.03-3.72.4-5.45 1.13-2.52 1.08-4.6 2.93-6.02 5.32-.87 1.47-1.32 3.12-1.32 4.82s.45 3.35 1.32 4.82c1.43 2.4 3.5 4.25 6.02 5.32 1.73.74 3.58 1.1 5.45 1.13 1.87-.03 3.72-.4 5.45-1.13 2.52-1.08 4.6-2.93 6.02-5.32.87-1.47 1.32-3.12 1.32-4.82s-.45-3.35-1.32-4.82C26.23 3.36 24.16 1.51 21.64.43c-1.73-.74-3.58-1.1-5.44-1.13V.03Zm0 1.38c1.66 0 3.3.34 4.82.98 2.13.9 3.9 2.48 5.08 4.5.73 1.28 1.1 2.73 1.1 4.22s-.37 2.94-1.1 4.22c-1.18 2.02-2.95 3.6-5.08 4.5-1.52.64-3.16.98-4.82.98-1.66 0-3.3-.34-4.82-.98-2.13-.9-3.9-2.48-5.08-4.5-.73-1.28-1.1-2.73-1.1-4.22s.37-2.94 1.1-4.22c1.18-2.02 2.95-3.6 5.08-4.5C12.9.75 14.55.4 16.2.4v.01Z"/>
  </svg>
);

interface Certification {
  name: string;
  issuer: string;
  url: string;
  logoSrc?: string; // Optional if icon is provided
  logoAlt: string;
  dataAiHint: string;
  icon?: ReactNode; // For inline SVGs
}

const certificationsData: Certification[] = [
  {
    name: "IBM DevOps and Software Engineering Professional Certificate",
    issuer: "IBM",
    url: "#", 
    logoSrc: "/logos/ibm.png", // Fallback, icon will be used
    logoAlt: "IBM Logo",
    dataAiHint: "ibm",
    icon: <IbmLogo />,
  },
  {
    name: "Microsoft Full-Stack Developer Professional Certificate",
    issuer: "Microsoft",
    url: "#", 
    logoSrc: "/logos/microsoft.png", 
    logoAlt: "Microsoft Logo",
    dataAiHint: "microsoft",
    icon: null, // Will use Image component
  },
  {
    name: "Meta Back-End Developer Professional Certificate",
    issuer: "Meta",
    url: "#", 
    logoSrc: "/logos/meta.png", // Fallback, icon will be used
    logoAlt: "Meta Logo",
    dataAiHint: "meta",
    icon: <MetaLogo />,
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "AWS Academy", // Updated based on resume
    url: "#", 
    logoSrc: "/logos/aws.png", 
    logoAlt: "AWS Logo",
    dataAiHint: "aws",
    icon: null, // Will use Image component
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
              <div className="h-10 flex items-center justify-center mb-4 w-full">
                {cert.icon ? cert.icon : (
                  cert.logoSrc && ( // Only render Image if logoSrc is present
                    <Image
                      src={cert.logoSrc}
                      alt={cert.logoAlt}
                      width={80} 
                      height={32} 
                      className="max-h-full w-auto" // Ensure it respects container height
                      objectFit="contain"
                      data-ai-hint={cert.dataAiHint}
                    />
                  )
                )}
              </div>
              <CardHeader className="p-0 mb-2 flex-shrink-0 min-h-[3em]"> {/* Ensure enough space for title */}
                <CardTitle className="text-base md:text-lg font-semibold text-primary group-hover:text-accent transition-colors leading-tight">
                  {cert.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-grow flex flex-col justify-center">
                <CardDescription className="text-muted-foreground text-sm">{cert.issuer}</CardDescription>
              </CardContent>
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
