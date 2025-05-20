
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CalendarDays } from 'lucide-react';
import Image from 'next/image';

interface ExperienceItemProps {
  title: string;
  company: string;
  duration: string;
  descriptionPoints: string[];
  companyLogoSrc?: string;
  companyLogoAlt?: string;
  dataAiHint?: string;
}

export default function ExperienceItem({ title, company, duration, descriptionPoints, companyLogoSrc, companyLogoAlt, dataAiHint }: ExperienceItemProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out w-full hover:scale-[1.02] bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            {companyLogoSrc && companyLogoAlt && dataAiHint && (
              <div className="flex-shrink-0 mt-1">
                <Image
                  src={companyLogoSrc}
                  alt={companyLogoAlt}
                  width={40}
                  height={40}
                  objectFit="contain"
                  data-ai-hint={dataAiHint}
                />
              </div>
            )}
            <div>
              <CardTitle className="text-xl font-semibold text-primary group-hover:text-accent transition-colors">{title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground flex items-center mt-1">
                <Briefcase className="mr-2 h-4 w-4 text-secondary" /> {company}
              </CardDescription>
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center whitespace-nowrap pt-1 sm:pt-0 sm:ml-auto sm:pl-4">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-secondary" /> {duration}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/80 leading-relaxed">
          {descriptionPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
