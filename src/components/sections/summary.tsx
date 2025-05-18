import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Summary() {
  return (
    <SectionWrapper id="summary-section" title="Summary">
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">
            Professional Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mt-4 text-lg leading-relaxed text-foreground/90">
            A brief summary of Lakshmi's key qualifications and career goals. Dedicated and innovative software professional with a strong foundation in machine learning and full-stack development, aiming to leverage expertise to build impactful and scalable technology solutions.
          </p>
          {/* More detailed summary points can be added here if needed */}
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
