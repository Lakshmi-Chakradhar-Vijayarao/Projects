
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';
import ContactForm from '@/components/contact-form';

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/Lakshmi-Chakradhar-Vijayarao', icon: Github, text: 'Lakshmi-Chakradhar-Vijayarao' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/lakshmichakradharvijayarao/', icon: Linkedin, text: 'lakshmichakradharvijayarao' },
];

export default function Contact() {
  return (
    <SectionWrapper id="contact" title="Get In Touch" className="bg-background/50">
      <Card className="max-w-3xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm border border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold text-primary">Let's Connect!</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            I'm always open to discussing new projects, creative ideas, or opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8 md:gap-12 p-8">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Contact Details</h3>
            <p className="text-muted-foreground mb-6">
              Feel free to reach out via email or connect with me on social media.
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:lakshmichakradhar.v@gmail.com" className="text-foreground/90 hover:text-primary transition-colors">
                  lakshmichakradhar.v@gmail.com
                </a>
              </div>
              {socialLinks.map((link) => (
                <div key={link.name} className="flex items-center space-x-3">
                  <link.icon className="h-5 w-5 text-primary" />
                  <Link href={link.href} target="_blank" rel="noopener noreferrer" className="text-foreground/90 hover:text-primary transition-colors">
                    {link.text}
                  </Link>
                </div>
              ))}
            </div>
            {/* Removed "Send me an Email" button */}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Send a Message</h3>
            <ContactForm />
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
