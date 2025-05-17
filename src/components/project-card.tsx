import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  imageHint: string;
  projectUrl: string;
}

export default function ProjectCard({ title, description, technologies, imageUrl, imageHint, projectUrl }: ProjectCardProps) {
  return (
    <a
      href={projectUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      aria-label={`View project: ${title}`}
    >
      <Card className="flex flex-col overflow-hidden bg-card/95 backdrop-blur-sm h-full relative shadow-lg group-hover:shadow-xl transition-all duration-300 ease-in-out group-hover:scale-[1.02]">
        <ExternalLink className="absolute top-4 right-4 h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        
        <div className="relative w-full h-48 sm:h-56">
          <Image
            src={imageUrl}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-110"
            data-ai-hint={imageHint}
          />
        </div>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary pr-10">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription className="text-sm text-foreground/80 leading-relaxed">{description}</CardDescription>
        </CardContent>
        <CardFooter>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </a>
  );
}
