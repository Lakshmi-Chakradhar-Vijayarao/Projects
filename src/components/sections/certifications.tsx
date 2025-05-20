"use client";

import type { ReactNode } from 'react';
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Simple SVG Logo Components
const IbmLogo = () => (
  <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto mb-4 text-primary fill-current">
    {/* A very simplified IBM-like logo pattern */}
    <rect x="0" y="10" width="10" height="20" />
    <rect x="12" y="10" width="10" height="3" />
    <rect x="12" y="15" width="10" height="3" />
    <rect x="12" y="20" width="10" height="3" />
    <rect x="12" y="25" width="10" height="3" />
    <rect x="24" y="10" width="10" height="20" />

    <rect x="38" y="10" width="10" height="20" />
    <rect x="50" y="10" width="3" height="20" />
    <rect x="55" y="10" width="10" height="3" />
    <rect x="55" y="27" width="10" height="3" />
    <path d="M55 13 Q60 13 60 10 L60 20 Q60 17 55 17 Z" />
    <path d="M55 27 Q60 27 60 30 L60 20 Q60 23 55 23 Z" />


    <path d="M70 10 H80 V13 H73 V18 H80 V21 H73 V27 H80 V30 H70 Z" />
  </svg>
);

const MicrosoftLogo = () => (
  <svg viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-4">
    <path fill="#f25022" d="M1 1h9v9H1z"/>
    <path fill="#00a4ef" d="M1 11h9v9H1z"/>
    <path fill="#7fba00" d="M11 1h9v9h-9z"/>
    <path fill="#ffb900" d="M11 11h9v9h-9z"/>
  </svg>
);

const MetaLogo = () => (
  // Simplified infinity-like symbol
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto mb-4 fill-current text-primary">
    <path d="M15 5 C5 5, 5 25, 15 25 S25 5, 30 15 S35 25, 45 25 S55 5, 45 5 S35 25, 30 15 S25 5, 15 5 Z" />
  </svg>
);


const AwsLogo = () => (
  // Simplified "aws" text-like logo
  <svg viewBox="0 0 180 100" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto mb-4 fill-current text-primary">
    <path d="M10 80 L30 20 L50 80 L40 80 L35 50 L25 50 L20 80 Z" />
    <path d="M60 80 V20 H70 V70 H100 V80 H60 Z M80 20 H90 V30 H80 Z" />
    <path d="M110 80 C100 80 95 70 95 60 S100 40 110 40 C120 40 125 50 125 60 C125 70 120 80 110 80 Z M110 45 C105 45 102 52 102 60 S105 75 110 75 S118 68 118 60 S115 45 110 45 Z" />
    <path d="M135 80 L135 20 L145 20 L145 55 L165 20 L175 20 L155 50 L175 80 L165 80 L150 55 L145 60 V80 Z" />
  </svg>
);

interface Certification {
  name: string;
  issuer: string;
  url: string;
  icon: ReactNode;
}

const certificationsData: Certification[] = [
  {
    name: "DevOps and Software Engineering Professional Certificate",
    issuer: "IBM",
    url: "#", // Placeholder URL
    icon: <IbmLogo />
  },
  {
    name: "Full-Stack Developer Professional Certificate",
    issuer: "Microsoft",
    url: "#", // Placeholder URL
    icon: <MicrosoftLogo />
  },
  {
    name: "Back-End Developer Professional Certificate",
    issuer: "Meta",
    url: "#", // Placeholder URL
    icon: <MetaLogo />
  },
  {
    name: "Cloud Practitioner",
    issuer: "AWS Academy",
    url: "#", // Placeholder URL
    icon: <AwsLogo />
  }
];

export default function Certifications() {
  return (
    <SectionWrapper id="certifications-section" title="Certifications">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {certificationsData.map((cert, index) => (
          <Link 
            key={index} // Using index as key is fine for static, non-reordering lists
            href={cert.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block group h-full" // Added h-full for consistent card height
            aria-label={`View certification: ${cert.name}`}
          >
            <Card className="h-full flex flex-col items-center text-center p-6 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50">
              <CardHeader className="p-0 mb-4 items-center"> {/* Added items-center */}
                {cert.icon}
                <CardTitle className="text-lg md:text-xl font-semibold text-primary group-hover:text-accent transition-colors leading-tight">
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
