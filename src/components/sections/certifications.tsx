
"use client";

import type { ReactNode } from 'react';
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Certification {
  name: string;
  issuer: string;
  url: string;
  logoSrc: string; // Path within public/logos/
  logoAlt: string;
  dataAiHint: string;
}

const certificationsData: Certification[] = [
  {
    name: "IBM DevOps and Software Engineering Professional Certificate",
    issuer: "IBM",
    url: "#",
    logoSrc: "/logos/ibm.png",
    logoAlt: "IBM Logo",
    dataAiHint: "ibm",
  },
  {
    name: "Microsoft Full-Stack Developer Professional Certificate",
    issuer: "Microsoft",
    url: "#",
    logoSrc: "/logos/microsoft.png",
    logoAlt: "Microsoft Logo",
    dataAiHint: "microsoft",
  },
  {
    name: "Meta Back-End Developer Professional Certificate",
    issuer: "Meta",
    url: "#",
    logoSrc: "/logos/meta.png",
    logoAlt: "Meta Logo",
    dataAiHint: "meta",
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "AWS Academy",
    url: "#",
    logoSrc: "/logos/aws.png",
    logoAlt: "AWS Logo",
    dataAiHint: "aws",
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
              <div className="mb-4 h-12 flex items-center justify-center"> {/* Logo container */}
                <Image
                  src={cert.logoSrc}
                  alt={cert.logoAlt}
                  width={100} // Adjusted width, can be fine-tuned
                  height={40} // Adjusted height
                  objectFit="contain"
                  data-ai-hint={cert.dataAiHint}
                />
              </div>
              <CardHeader className="p-0 mb-2 flex-shrink-0">
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
