
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  date: string;
  description: string;
  technologies: string[];
  image: string;
  imageHint: string;
  index: number;
  inView: boolean;
  projectUrl: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  title, 
  date, 
  description, 
  technologies, 
  image,
  imageHint,
  index,
  inView,
  projectUrl
}) => {
  return (
    <a
      href={projectUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative block bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/50 group opacity-0 ${
        inView ? 'animate-scale-up' : ''
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
      aria-label={`View project: ${title}`}
    >
      <div className="absolute top-3 right-3 p-1.5 bg-card/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 backdrop-blur-sm">
        <ExternalLink className="h-4 w-4 text-primary" />
      </div>

      <div className="relative h-48 md:h-56 overflow-hidden">
        <Image 
          src={image} 
          alt={title} 
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-700 group-hover:scale-110" 
          data-ai-hint={imageHint}
        />
         <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent group-hover:from-black/10 transition-all duration-300"></div>
      </div>
      <div className="p-5 md:p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-primary pr-8 group-hover:text-accent transition-colors">{title}</h3> 
          <span className="text-xs text-muted-foreground pt-1">{date}</span>
        </div>
        <p className="text-foreground/80 mb-4 text-sm leading-relaxed line-clamp-3">{description}</p>
        <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-border/30">
          {technologies.map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs bg-secondary/70 text-secondary-foreground group-hover:bg-secondary transition-colors">
              {tech}
            </Badge>
          ))}
        </div>
      </div>
    </a>
  );
};

export default ProjectCard;
