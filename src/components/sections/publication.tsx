"use client";
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpenText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const publicationData = {
  title: "TEXT DETECTION BASED ON DEEP LEARNING",
  conference: "Presented at IEEE’s International Conference on Intelligent Data Communication and Analytics.",
  details: [
    "Built a handwriting recognition model using MNIST-style data, achieving 98.6% training precision and 96.9% test accuracy."
  ],
  url: "#" 
};

export default function Publication() {
  return (
    <SectionWrapper id="publication-section" title="Publication">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm group w-full max-w-2xl mx-auto">
        <Link href={publicationData.url} target="_blank" rel="noopener noreferrer" aria-label={`View publication: ${publicationData.title}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center mb-2">
                <BookOpenText className="h-6 w-6 mr-3 text-primary flex-shrink-0" />
                <CardTitle className="text-xl font-semibold text-primary group-hover:text-accent transition-colors">{publicationData.title}</CardTitle>
              </div>
              <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
            </div>
            <CardDescription className="text-muted-foreground">{publicationData.conference}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80 leading-relaxed">
              {publicationData.details.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </CardContent>
        </Link>
      </Card>
    </SectionWrapper>
  );
}
