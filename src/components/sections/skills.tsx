"use client";

import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';
import { Code2, Library, BrainCircuit, CloudCog, Database, Wrench, Users } from 'lucide-react';

interface SkillCategory {
  name: string;
  icon: ReactNode;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    name: "Programming Languages",
    icon: <Code2 className="h-5 w-5 mr-2 text-primary" />,
    skills: ["Python", "Java", "JavaScript (ES6+)", "C++", "C", "C#"],
  },
  {
    name: "Frameworks & Libraries",
    icon: <Library className="h-5 w-5 mr-2 text-primary" />,
    skills: ["React.js", "Node.js", "Express.js", "Django", "Scikit-learn", "YOLO", "OpenCV", "NumPy", "Pandas"],
  },
  {
    name: "Data & Machine Learning",
    icon: <BrainCircuit className="h-5 w-5 mr-2 text-primary" />,
    skills: ["PySpark", "Hadoop", "Databricks", "ML algorithms: Decision Trees, Random Forest, KNN, YOLO", "Model evaluation, cross-validation", "data preprocessing"],
  },
  {
    name: "Cloud & DevOps",
    icon: <CloudCog className="h-5 w-5 mr-2 text-primary" />,
    skills: ["AWS (EC2, S3, Lambda – foundational)", "GitHub Actions", "CI/CD fundamentals", "Docker (familiar)", "REST API integration", "Linux"],
  },
  {
    name: "Databases",
    icon: <Database className="h-5 w-5 mr-2 text-primary" />,
    skills: ["MySQL", "PostgreSQL", "SQL"],
  },
  {
    name: "Tools & Practices",
    icon: <Wrench className="h-5 w-5 mr-2 text-primary" />, // Changed from Users for better representation of "Tools"
    skills: ["Git", "VS Code", "Eclipse", "Jupyter Notebook", "Agile development", "API design", "cross-functional collaboration"],
  },
];

export default function Skills() {
  return (
    <SectionWrapper id="skills-section" title="Technical Skills">
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm border border-border/50">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10"> {/* Updated to 2 columns on md+, adjusted gap */}
            {skillCategories.map((category) => (
              <div key={category.name}>
                <h3 className="text-xl font-semibold text-primary mb-4 flex items-center">
                  {category.icon}
                  <span>{category.name}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60 text-sm px-3 py-1"
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
