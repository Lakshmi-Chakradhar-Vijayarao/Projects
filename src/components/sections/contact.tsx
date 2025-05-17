import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

const contactDetails = [
  { icon: Mail, text: 'lakshmichakradhar.v@gmail.com', href: 'mailto:lakshmichakradhar.v@gmail.com', label: 'Email' },
  { icon: Phone, text: '+1 (469)-783-4637', href: 'tel:+14697834637', label: 'Phone' },
  { icon: Linkedin, text: 'LinkedIn Profile', href: 'https://www.linkedin.com/in/lakshmicv/', label: 'LinkedIn' },
  { icon: Github, text: 'GitHub Profile', href: 'https://github.com/lakshmicv', label: 'GitHub' },
  { icon: MapPin, text: 'Dallas, TX, USA', href: '#', label: 'Location', noLink: true },
];

export default function Contact() {
  return (
    <SectionWrapper id="contact" title="Get In Touch" className="bg-secondary">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center text-primary">Let's Connect!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-foreground/80">
            I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions.
          </p>
          <div className="space-y-4">
            {contactDetails.map((item) => (
              <div key={item.label} className="flex items-center space-x-3">
                <item.icon className="h-6 w-6 text-primary" />
                {item.noLink ? (
                   <span className="text-foreground/90">{item.text}</span>
                ) : (
                  <Link href={item.href} target={item.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="text-foreground/90 hover:text-primary transition-colors">
                    {item.text}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="pt-4 text-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 transition-transform hover:scale-105 shadow-md" asChild>
              <a href="mailto:lakshmichakradhar.v@gmail.com">
                Send me an Email <Mail className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
