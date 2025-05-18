import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, CalendarDays } from 'lucide-react';

const educationData = [
  {
    degree: "Master of Science in Computer Science",
    institution: "University of Example",
    duration: "2020 - 2022",
    details: "Specialized in Machine Learning and Artificial Intelligence. Relevant coursework: Advanced Algorithms, Deep Learning, Natural Language Processing."
  },
  {
    degree: "Bachelor of Technology in Information Technology",
    institution: "Example Institute of Technology",
    duration: "2016 - 2020",
    details: "Graduated with honors. Capstone project on a web-based recommendation system."
  }
];

export default function Education() {
  return (
    <SectionWrapper id="education-section" title="Education">
      <div className="space-y-8">
        {educationData.map((edu, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center mb-2">
                <GraduationCap className="h-6 w-6 mr-3 text-primary" />
                <CardTitle className="text-xl font-semibold text-primary">{edu.degree}</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">{edu.institution}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span>{edu.duration}</span>
              </div>
              <p className="text-foreground/80">{edu.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
