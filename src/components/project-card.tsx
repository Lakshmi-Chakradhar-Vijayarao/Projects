// Ensure this component is a client component if it uses hooks directly or indirectly
// or if it's part of a tree that needs client-side interactivity from parent.
// However, in this specific refactor, the direct client logic (useInView) is in the parent.
// "use client"; // Can be omitted if parent (Projects.tsx) is "use client" and passes all needed props

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface ProjectCardProps {
  title: string;
  date: string;
  description: string;
  technologies: string[];
  image: string;
  imageHint: string; // Added for data-ai-hint
  index: number;
  inView: boolean;
  projectUrl: string; // Added to make the card clickable
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
      className={`block bg-card/80 backdrop-blur-md border rounded-lg shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl group opacity-0 ${
        inView ? 'animate-scale-up' : ''
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
      aria-label={`View project: ${title}`}
    >
      <div className="relative h-48 overflow-hidden"> {/* Added relative for Next/Image fill */}
        <Image 
          src={image} 
          alt={title} 
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-700 group-hover:scale-110" 
          data-ai-hint={imageHint}
        />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-primary">{title}</h3>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <p className="text-foreground/80 mb-4 text-sm leading-relaxed">{description}</p>
        <div className="flex flex-wrap mt-3">
          {technologies.map((tech) => (
            <Badge key={tech} variant="secondary" className="mr-2 mb-2 text-xs">
              {tech}
            </Badge>
          ))}
        </div>
      </div>
    </a>
  );
};

export default ProjectCard;
