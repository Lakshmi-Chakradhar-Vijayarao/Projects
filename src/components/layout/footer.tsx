import { Github, Linkedin, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/lakshmicv', icon: Github },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/lakshmicv/', icon: Linkedin },
  { name: 'Email', href: 'mailto:lakshmichakradhar.v@gmail.com', icon: Mail },
  { name: 'Phone', href: 'tel:+14697834637', icon: Phone },
];

export default function Footer() {
  return (
    <footer className="border-t bg-background/80">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Lakshmi Chakradhar Vijayarao. All rights reserved.
        </p>
        <div className="flex space-x-4">
          {socialLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label={link.name}
            >
              <link.icon className="h-5 w-5" />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
