
"use client";

import type { ReactNode } from 'react';
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Simple SVG Logo Components
const IbmLogo = () => (
  <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto mb-4 text-blue-600 fill-current">
    <path d="M0 0 H12 V8 H20 V0 H32 V24 H20 V16 H12 V24 H0 Z M12 10 H20 V14 H12 Z"></path>
    <path d="M36 0 H46 A12 12 0 0 1 46 24 H36 A12 12 0 0 1 36 0 Z M41 4 A7 7 0 0 0 41 20 A7 7 0 0 0 41 4 Z"></path>
    <path d="M56 0 V24 H63 L70 10 V24 H78 V0 H70 L63 14 V0 Z"></path>
    <g transform="translate(0, 28)">
      <rect width="100" height="2" />
      <rect y="4" width="100" height="2" />
      <rect y="8" width="100" height="2" />
    </g>
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
  <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto mb-4 fill-current text-blue-500">
    <path d="M73.08,22.36c-2.06-2.06-4.78-3.26-7.67-3.26a10.72,10.72,0,0,0-8.07,3.65,11.52,11.52,0,0,0-2.79,8A10.72,10.72,0,0,0,62.62,41.08a10.51,10.51,0,0,0,7.67-3.26c2.06-2.06,3.26-4.78,3.26-7.67S75.14,24.42,73.08,22.36ZM62.62,37.22a6.72,6.72,0,1,1,6.72-6.72A6.73,6.73,0,0,1,62.62,37.22Z" />
    <path d="M50,10.5A10.72,10.72,0,0,0,39.61,21.22a11.52,11.52,0,0,0,2.79,8,10.72,10.72,0,0,0,15.74-.39c2.06-2.06,3.26-4.78,3.26-7.67S52.06,12.56,50,10.5ZM50,27.44a6.72,6.72,0,1,1,6.72-6.72A6.73,6.73,0,0,1,50,27.44Z" />
    <path d="M26.92,22.36c-2.06-2.06-4.78-3.26-7.67-3.26A10.72,10.72,0,0,0,11.18,22a10.8,10.8,0,0,0-.39,15.74,10.51,10.51,0,0,0,7.67,3.26c2.06,0,4.78-1.2,7.67-3.26,2.06-2.06,3.26-4.78,3.26-7.67S29,24.42,26.92,22.36ZM19.25,37.22a6.72,6.72,0,1,1,6.72-6.72A6.73,6.73,0,0,1,19.25,37.22Z" />
  </svg>
);


const AwsLogo = () => (
  <svg viewBox="0 0 180 108" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto mb-4">
    <path fill="#FF9900" d="M45.59,67.17H32.91L26.86,81H12.55L33,40.08H45.43L66,81H51.68Zm-2.33-13L39.5,44.24a4.31,4.31,0,0,0-.49-2.33l-.16-.73a11.69,11.69,0,0,0-1.47-4H38.16L30.2,54.19Z"/>
    <path fill="#232F3E" d="M80.2,50.33c0-6.63,4.47-10.41,11.3-10.41,4.31,0,7.28,1.31,9.41,3.44l-4.79,4.47c-1.31-1.15-2.95-2-5.08-2-2.79,0-4.63,1.63-4.63,4.63,0,2.79,1.8,4.47,4.92,4.47,1.8,0,3.6-.82,4.79-1.92v-3H86.6v-6.3H96.26V61.6c-2.45,3.11-6,5.08-10.57,5.08C76.21,66.68,70,61.6,70,53.26a12.5,12.5,0,0,1,.82-5.08l6.79,1.63a6.5,6.5,0,0,0-.49,2.54Z"/>
    <path fill="#232F3E" d="M124.64,50.33c0-6.63,4.47-10.41,11.3-10.41,4.31,0,7.28,1.31,9.41,3.44l-4.79,4.47c-1.31-1.15-2.95-2-5.08-2-2.79,0-4.63,1.63-4.63,4.63,0,2.79,1.8,4.47,4.92,4.47,1.8,0,3.6-.82,4.79-1.92v-3h-4.55v-6.3h9.56V61.6c-2.45,3.11-6,5.08-10.57,5.08-9.72,0-16.05-5.08-16.05-13.42A12.5,12.5,0,0,1,115.47,45.25l6.79,1.63a6.5,6.5,0,0,0-.49,2.54Z"/>
    <path fill="#FF9900" d="M0,93.65a73,73,0,0,0,73,14.35,73,73,0,0,0,73-14.35H122.7a49.77,49.77,0,0,1-49.69,10.08A49.77,49.77,0,0,1,23.32,93.65Zm126.81-3.6a3.6,3.6,0,0,0,3.6-3.6H110.19V76.33h27.36a3.6,3.6,0,0,0,3.6-3.6H110.19V62.61h30.94a3.6,3.6,0,0,0,3.6-3.6H110.19V48.88h34.54a3.6,3.6,0,0,0,0-7.19H0v7.19H106.6V90.05Z"/>
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
    url: "#",
    icon: <IbmLogo />
  },
  {
    name: "Full-Stack Developer Professional Certificate",
    issuer: "Microsoft",
    url: "#",
    icon: <MicrosoftLogo />
  },
  {
    name: "Back-End Developer Professional Certificate",
    issuer: "Meta",
    url: "#",
    icon: <MetaLogo />
  },
  {
    name: "Cloud Practitioner", // Shortened title to better fit the card
    issuer: "AWS Academy",
    url: "#",
    icon: <AwsLogo />
  }
];

export default function Certifications() {
  return (
    <SectionWrapper id="certifications-section" title="Certifications">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {certificationsData.map((cert) => (
          <Link 
            key={cert.name}
            href={cert.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block group"
            aria-label={`View certification: ${cert.name}`}
          >
            <Card className="h-full flex flex-col items-center text-center p-6 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50">
              <CardHeader className="p-0 mb-3">
                {cert.icon}
                <CardTitle className="text-lg font-semibold text-primary group-hover:text-accent transition-colors leading-tight">
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
