import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu, Code, Database, Brain, Cloud } from 'lucide-react';

const skillCategories = [
  {
    name: "Programming Languages",
    icon: <Code className="h-5 w-5 mr-2 text-primary" />,
    skills: ["Python", "JavaScript", "TypeScript", "Java", "C++", "SQL"]
  },
  {
    name: "Frameworks & Libraries",
    icon: <Cpu className="h-5 w-5 mr-2 text-primary" />,
    skills: ["React.js", "Node.js", "Express.js", "Next.js", "TensorFlow", "Keras", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "YOLO"]
  },
  {
    name: "Databases",
    icon: <Database className="h-5 w-5 mr-2 text-primary" />,
    skills: ["MySQL", "PostgreSQL", "MongoDB"]
  },
  {
    name: "Machine Learning",
    icon: <Brain className="h-5 w-5 mr-2 text-primary" />,
    skills: ["Object Detection", "NLP", "Computer Vision", "Ensemble Models", "Deep Learning"]
  },
  {
    name: "Tools & Platforms",
    icon: <Cloud className="h-5 w-5 mr-2 text-primary" />,
    skills: ["AWS", "Docker", "Git", "Databricks", "Jupyter Notebooks", "Linux"]
  }
];

export default function Skills() {
  return (
    <SectionWrapper id="skills-section" title="Technical Skills">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {skillCategories.map((category) => (
          <Card key={category.name} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-primary flex items-center">
                {category.icon}
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm bg-secondary/70 text-secondary-foreground">
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
