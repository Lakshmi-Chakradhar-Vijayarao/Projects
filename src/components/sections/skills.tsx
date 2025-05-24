"use client";

import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';
import { Code2, Library, BrainCircuit, CloudCog, Database, Users, Wrench } from 'lucide-react'; // Added Wrench

interface SkillCategory {
  name: string;
  icon: ReactNode;
  skills: string[];
}

// Curated list of skills
const skillCategoriesData: SkillCategory[] = [
  {
    name: "Programming Languages",
    icon: <Code2 className="h-5 w-5 mr-2 text-primary" />,
    skills: ["Python", "Java", "JavaScript (ES6+)", "C++"],
  },
  {
    name: "Frameworks & Libraries",
    icon: <Library className="h-5 w-5 mr-2 text-primary" />,
    skills: ["React.js", "Node.js", "Django", "Scikit-learn", "YOLO", "OpenCV", "Pandas", "NumPy"],
  },
  {
    name: "Data & Machine Learning",
    icon: <BrainCircuit className="h-5 w-5 mr-2 text-primary" />,
    skills: ["PySpark", "Hadoop", "Databricks", "Object Detection", "Ensemble Models", "Data Preprocessing"],
  },
  {
    name: "Cloud & DevOps",
    icon: <CloudCog className="h-5 w-5 mr-2 text-primary" />,
    skills: ["AWS (EC2, S3, Lambda)", "Docker", "CI/CD Fundamentals", "REST APIs"],
  },
  {
    name: "Databases",
    icon: <Database className="h-5 w-5 mr-2 text-primary" />,
    skills: ["MySQL", "PostgreSQL", "SQL"],
  },
  {
    name: "Tools & Practices",
    icon: <Wrench className="h-5 w-5 mr-2 text-primary" />, // Changed icon to Wrench
    skills: ["Git", "VS Code", "Agile Development", "API Design"],
  },
];


export default function Skills() {
  return (
    <SectionWrapper id="skills-section" title="Technical Skills">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm border border-border/50">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {skillCategoriesData.map((category) => (
              <div key={category.name}>
                <h3 className="text-xl font-semibold text-primary mb-4 flex items-center">
                  {category.icon}
                  <span>{category.name}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary" // Using secondary (Deep Purple with 70% opacity) for consistency
                      className="text-xs sm:text-sm bg-secondary/70 text-secondary-foreground hover:bg-secondary/90 transition-colors"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
