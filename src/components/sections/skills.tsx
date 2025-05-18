
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Cpu, Database, Cloud, Users, Brain, Settings } from 'lucide-react'; // Added Users, Brain, Settings

const skillCategories = [
  {
    name: "Programming Languages",
    icon: <Code className="h-5 w-5 mr-2 text-primary" />,
    skills: ["Python", "Java", "JavaScript (ES6+)", "C++", "C", "C#", "SQL"] // Added SQL
  },
  {
    name: "Frameworks & Libraries",
    icon: <Cpu className="h-5 w-5 mr-2 text-primary" />,
    skills: ["React.js", "Node.js", "Express.js", "Django", "Scikit-learn", "YOLO", "OpenCV", "Pandas", "NumPy"] // Grouped ML libraries here
  },
  {
    name: "Data & Big Data", // Renamed to match resume
    icon: <Database className="h-5 w-5 mr-2 text-primary" />,
    skills: ["PySpark", "Hadoop", "Databricks"] // Kept DBs separate for clarity as per resume structure
  },
  {
    name: "Databases",
    icon: <Database className="h-5 w-5 mr-2 text-primary" />, // Re-using icon, or choose another if preferred
    skills: ["MySQL", "PostgreSQL", "Oracle"]
  },
  {
    name: "Cloud & DevOps Concepts", // Updated category name
    icon: <Cloud className="h-5 w-5 mr-2 text-primary" />,
    skills: ["AWS (familiar)", "Docker (familiar)", "Git", "Linux", "CI/CD fundamentals"] // Added CI/CD
  },
  {
    name: "Tools", // Updated category name
    icon: <Settings className="h-5 w-5 mr-2 text-primary" />, // Changed icon to Settings
    skills: ["VS Code", "Eclipse", "REST APIs"] // Added Eclipse, specified REST APIs
  },
  {
    name: "Methodologies", // New category
    icon: <Users className="h-5 w-5 mr-2 text-primary" />,
    skills: ["Agile", "Unit Testing", "API Design", "Cross-team Collaboration"]
  },
   { // Combined ML concepts with main libraries under Frameworks & Libraries as per resume.
    // If needed, this could be a separate "Machine Learning Concepts" category.
    name: "Machine Learning Concepts",
    icon: <Brain className="h-5 w-5 mr-2 text-primary" />,
    skills: ["Object Detection", "NLP", "Computer Vision", "Ensemble Models", "Deep Learning", "Data Preprocessing", "Model Evaluation"]
  }
];

export default function Skills() {
  return (
    <SectionWrapper id="skills-section" title="Technical Skills">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {skillCategories.map((category) => (
          <Card key={category.name} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm border border-border/50 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-primary flex items-center">
                {category.icon}
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs sm:text-sm bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-colors">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}

