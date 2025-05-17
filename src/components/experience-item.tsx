import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CalendarDays } from 'lucide-react';

interface ExperienceItemProps {
  title: string;
  company: string;
  duration: string;
  descriptionPoints: string[];
}

export default function ExperienceItem({ title, company, duration, descriptionPoints }: ExperienceItemProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground flex items-center mt-1">
              <Briefcase className="mr-2 h-4 w-4" /> {company}
            </CardDescription>
          </div>
          <div className="text-xs text-muted-foreground flex items-center whitespace-nowrap">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> {duration}
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
