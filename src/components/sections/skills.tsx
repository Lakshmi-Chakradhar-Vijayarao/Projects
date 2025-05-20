
"use client";
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

const skillCategories = [
  {
    name: "Core Technical Skills",
    icon: <Brain className="h-5 w-5 mr-2 text-primary" />,
    skills: ["Python", "PySpark", "DevOps Concepts", "Machine Learning"]
  }
];

export default function Skills() {
  return (
    <SectionWrapper id="skills-section" title="Technical Skills">
      <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8"> {/* Adjusted grid for potentially single card */}
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
