"use client";
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Github, Linkedin, Mail, Phone, FileText } from 'lucide-react';
import Link from 'next/link';
import ContactForm from '@/components/contact-form';

const socialLinks = [
  { name: 'Email', href: 'mailto:lakshmichakradhar.v@gmail.com', icon: Mail, text: 'lakshmichakradhar.v@gmail.com' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/lakshmichakradharvijayarao/', icon: Linkedin, text: 'lakshmichakradharvijayarao' },
  { name: 'GitHub', href: 'https://github.com/Lakshmi-Chakradhar-Vijayarao', icon: Github, text: 'Lakshmi-Chakradhar-Vijayarao' },
  { name: 'Phone', href: 'tel:+14697834637', icon: Phone, text: '+1 (469)-783-4637' },
];

export default function Contact() {
  return (
    <SectionWrapper id="contact" title="Get In Touch" className="bg-background/50">
      <Card className="max-w-4xl mx-auto shadow-xl bg-card/90 backdrop-blur-sm border border-border/50">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-semibold text-primary">Let's Connect!</CardTitle>
          <CardDescription className="text-muted-foreground mt-2 max-w-lg mx-auto">
            I'm always open to discussing new projects, creative ideas, or opportunities. Feel free to reach out!
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8 md:gap-12 p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Contact Details</h3>
              <div className="space-y-3">
                {socialLinks.map((link) => (
                  <div key={link.name} className="flex items-center space-x-3">
                    <link.icon className="h-5 w-5 text-primary flex-shrink-0" />
                    <Link href={link.href} target="_blank" rel="noopener noreferrer" className="text-foreground/90 hover:text-primary transition-colors break-all">
                      {link.text}
                    </Link>
                  </div>
                ))}
                 <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <a href="/Lakshmi_resume.pdf" target="_blank" rel="noopener noreferrer" className="text-foreground/90 hover:text-primary transition-colors">
                      Download My Resume
                    </a>
                  </div>
              </div>
            </div>
            
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
