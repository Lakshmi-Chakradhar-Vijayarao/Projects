
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const certificationsData = [
  {
    name: "IBM DevOps and Software Engineering Professional Certificate",
    issuer: "IBM",
    url: "#" 
  },
  {
    name: "Microsoft Full-Stack Developer Professional Certificate",
    issuer: "Microsoft",
    url: "#"
  },
  {
    name: "Meta Back-End Developer Professional Certificate",
    issuer: "Meta",
    url: "#"
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "AWS Academy", // As per resume
    url: "#"
  }
];

export default function Certifications() {
  return (
    <SectionWrapper id="certifications-section" title="Certifications">
      <div className="grid md:grid-cols-2 gap-8">
        {certificationsData.map((cert, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm group">
             <Link href={cert.url} target="_blank" rel="noopener noreferrer" aria-label={`View certification: ${cert.name}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center mb-2">
                    <Award className="h-6 w-6 mr-3 text-primary" />
                    <CardTitle className="text-lg md:text-xl font-semibold text-primary group-hover:text-accent transition-colors leading-tight">{cert.name}</CardTitle>
                  </div>
                   <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                </div>
                <CardDescription className="text-muted-foreground">{cert.issuer}</CardDescription>
              </CardHeader>
              {/* Removed CardContent as date is not provided in the new resume format for certs */}
            </Link>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}

