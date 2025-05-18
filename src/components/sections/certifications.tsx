import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const certificationsData = [
  {
    name: "AWS Certified Solutions Architect - Associate",
    issuer: "Amazon Web Services",
    date: "Issued: Jan 2023",
    url: "#" // Placeholder URL
  },
  {
    name: "Deep Learning Specialization",
    issuer: "Coursera (deeplearning.ai)",
    date: "Completed: Jun 2022",
    url: "#" // Placeholder URL
  },
  {
    name: "TensorFlow Developer Certificate",
    issuer: "Google",
    date: "Issued: Mar 2022",
    url: "#" // Placeholder URL
  }
];

export default function Certifications() {
  return (
    <SectionWrapper id="certifications-section" title="Certifications & Awards">
      <div className="grid md:grid-cols-2 gap-8">
        {certificationsData.map((cert, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm group">
             <Link href={cert.url} target="_blank" rel="noopener noreferrer" aria-label={`View certification: ${cert.name}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center mb-2">
                    <Award className="h-6 w-6 mr-3 text-primary" />
                    <CardTitle className="text-xl font-semibold text-primary group-hover:text-accent transition-colors">{cert.name}</CardTitle>
                  </div>
                   <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardDescription className="text-muted-foreground">{cert.issuer}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{cert.date}</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
       {/* You can add an "Awards" subsection here if needed */}
    </SectionWrapper>
  );
}
