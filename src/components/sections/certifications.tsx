"use client";

import type { ReactNode } from 'react';
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Certification {
  name: string;
  issuer: string;
  url: string;
  logoSrc?: string | null; // Can be null if using icon
  logoAlt: string;
  dataAiHint: string;
  icon?: ReactNode | null; // If we have a custom SVG or Lucide icon
  logoWidth?: number;
  logoHeight?: number;
}

// Define inline SVG components if needed for some logos, or use Image for all
// For now, setting icon to null for all to use next/image based on previous requests

const certificationsData: Certification[] = [
  {
    name: "IBM DevOps and Software Engineering Professional Certificate",
    issuer: "IBM",
    url: "#", // Replace with actual URL
    logoSrc: "/logos/ibm.png", // User will upload 'ibm.png' to public/logos
    logoAlt: "IBM Logo",
    dataAiHint: "ibm",
    icon: null,
    logoWidth: 100, // Example width
    logoHeight: 40,  // Example height
  },
  {
    name: "Microsoft Full-Stack Developer Professional Certificate",
    issuer: "Microsoft",
    url: "#", // Replace with actual URL
    logoSrc: "/logos/microsoft.png", // User will upload 'microsoft.png' to public/logos
    logoAlt: "Microsoft Logo",
    dataAiHint: "microsoft",
    icon: null,
    logoWidth: 120, // Example width, Microsoft logo can be wide
    logoHeight: 30,  // Example height
  },
  {
    name: "Meta Back-End Developer Professional Certificate",
    issuer: "Meta",
    url: "#", // Replace with actual URL
    logoSrc: "/logos/meta.png", // User will upload 'meta.png' to public/logos
    logoAlt: "Meta Logo",
    dataAiHint: "meta",
    icon: null,
    logoWidth: 90,  // Example width
    logoHeight: 40, // Example height
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "AWS Academy",
    url: "#", // Replace with actual URL
    logoSrc: "/logos/aws.png", // User will upload 'aws.png' to public/logos
    logoAlt: "AWS Logo",
    dataAiHint: "aws",
    icon: null,
    logoWidth: 70,  // Example width, AWS smile can be more compact
    logoHeight: 50, // Example height
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
              <div className="mb-4 flex items-center justify-center" style={{ height: cert.logoHeight ? `${cert.logoHeight + 10}px` : '60px' }}> {/* Container with a bit of extra space */}
                {cert.icon ? cert.icon : (
                  cert.logoSrc && (
                    <Image
                      src={cert.logoSrc}
                      alt={cert.logoAlt}
                      width={cert.logoWidth || 80}   // Use specific or default width
                      height={cert.logoHeight || 32} // Use specific or default height
                      className="max-h-full w-auto" 
                      objectFit="contain"
                      data-ai-hint={cert.dataAiHint}
                    />
                  )
                )}
                {!cert.icon && !cert.logoSrc && <Award className="h-10 w-10 text-primary" />}
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
