
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, CalendarDays, MapPin } from 'lucide-react';

const educationData = [
  {
    degree: "Master of Science in Computer Science",
    institution: "The University of Texas at Dallas",
    duration: "Expected: May 2025",
    details: "GPA: 3.607 / 4.0",
    location: "Dallas, USA"
  },
  {
    degree: "Bachelor of Engineering in Electronics and Communication Engineering",
    institution: "R.M.K. Engineering College",
    duration: "Graduated: Mar 2023", // Assuming based on resume dates, adjust if needed
    details: "GPA: 9.04 / 10.0",
    location: "Chennai, India"
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
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span>{edu.duration}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{edu.location}</span>
              </div>
              <p className="text-foreground/80">{edu.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}

