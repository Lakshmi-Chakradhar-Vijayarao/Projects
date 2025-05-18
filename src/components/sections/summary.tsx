
// This component is effectively being replaced by the updated AboutMe section
// and the content from the resume's "PROFESSIONAL SUMMARY".
// Keeping the file for now but it's not actively used in page.tsx
// if the new "About Me" covers the summary adequately.
// If a distinct "Summary" section is still desired, this can be updated.

import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Summary() {
  return (
    <SectionWrapper id="summary-section" title="Professional Summary">
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mt-4 text-lg leading-relaxed text-foreground/90">
            Versatile Software Engineer and Machine Learning practitioner with proven experience delivering scalable, secure, and user-centric applications using Python, React.js, Node.js, and MySQL. Skilled at optimizing backend performance, implementing secure authentication, and developing AI-powered solutions with measurable outcomes. Strong collaborator with expertise in Agile workflows, continuous learning, and cloud technologies.
          </p>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}

