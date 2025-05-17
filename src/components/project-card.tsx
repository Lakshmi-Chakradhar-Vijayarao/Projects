
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react'; // Import the icon

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
      className={`relative block bg-card/80 backdrop-blur-md border rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl group opacity-0 ${ // Added relative for icon positioning
        inView ? 'animate-scale-up' : ''
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
      aria-label={`View project: ${title}`}
    >
      {/* External Link Icon */}
      <div className="absolute top-4 right-4 p-1 bg-card/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <ExternalLink className="h-5 w-5 text-primary" />
      </div>

      <div className="relative h-48 overflow-hidden">
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
          {/* Adjust paddingRight if title is too long and collides with icon space, though icon is above content */}
          <h3 className="text-xl font-semibold text-primary pr-8">{title}</h3> 
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
