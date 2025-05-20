
"use client";

import type { ReactNode } from 'react';
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Updated SVG Logo Components to better match screenshot
const IbmLogo = () => (
  <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto mb-4 text-primary fill-current">
    {/* Simplified IBM-like stripes */}
    <rect y="0" width="100" height="6"/>
    <rect y="10" width="100" height="6"/>
    <rect y="20" width="100" height="6"/>
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
  <svg viewBox="0 0 200 100" className="h-8 w-auto mb-4 text-primary fill-current">
    <path d="M100 50 C 50 0, 50 100, 100 50 C 150 0, 150 100, 100 50 M 70 50 C 70 25, 130 25, 130 50 C 130 75, 70 75, 70 50 Z" />
  </svg>
);

const AwsLogo = () => (
  // Simplified AWS "smile" logo, directly filled with orange
  <svg viewBox="0 0 64 38" className="h-10 w-auto mb-4" fill="#FF9900"> {/* AWS Orange */}
    <path d="M18.7,32.5C15.9,32.5,15,31.6,15,30.5V7.8c0-1.5,1.3-2.4,3.6-2.4c1.9,0,3.5,0.8,3.5,2.2v13.4h8.2V7.6 c0-1.4,1.3-2.2,3.3-2.2c2.2,0,3.6,0.9,3.6,2.4v22.9c0,0.9-0.8,1.6-2.7,1.6c-2.4,0-3.7-1.1-3.7-2.6V19.9h-8.2v10.9 C22.4,31.9,21.1,32.5,18.7,32.5z M47.8,32.5c-2.2,0-3.6-0.9-3.6-2.4V7.6c0-1.4,1.3-2.2,3.3-2.2c2.2,0,3.6,0.9,3.6,2.4 v22.9c0,0.9-0.8,1.6-2.7,1.6C48.5,32.5,48.2,32.5,47.8,32.5z"/>
    <path d="M60.1,29.9c0.7,2.1,1.7,3.9,2.9,5.4c-3.4,3.3-7.9,5.3-12.8,5.3c-10.3,0-18.7-8.4-18.7-18.7c0-10.3,8.4-18.7,18.7-18.7 c4.9,0,9.4,1.9,12.8,5.3c-1.2,1.5-2.2,3.3-2.9,5.4c-2.2-2.5-5.3-4-8.7-4c-6.5,0-11.8,5.3-11.8,11.8S41.6,34,48.1,34 C51.5,34,54.6,32.4,56.8,29.9L60.1,29.9z"/>
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
    name: "IBM DevOps and Software Engineering Professional Certificate",
    issuer: "IBM",
    url: "#", 
    icon: <IbmLogo />
  },
  {
    name: "Microsoft Full-Stack Developer Professional Certificate",
    issuer: "Microsoft",
    url: "#", 
    icon: <MicrosoftLogo />
  },
  {
    name: "Meta Back-End Developer Professional Certificate",
    issuer: "Meta",
    url: "#", 
    icon: <MetaLogo />
  },
  {
    name: "AWS Certified Cloud Practitioner", // Updated name
    issuer: "AWS Academy", // Updated issuer to be more specific if that's the case
    url: "#", 
    icon: <AwsLogo />
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
              <CardHeader className="p-0 mb-4 items-center"> 
                {cert.icon}
                <CardTitle className="text-lg md:text-xl font-semibold text-primary group-hover:text-accent transition-colors leading-tight mt-2">
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

