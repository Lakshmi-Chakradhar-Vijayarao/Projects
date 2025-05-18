import { Github, Linkedin, Mail, Phone, Code } from 'lucide-react';
import Link from 'next/link';

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/lakshmicv', icon: Github },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/lakshmicv/', icon: Linkedin },
  { name: 'Email', href: 'mailto:lakshmichakradhar.v@gmail.com', icon: Mail },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/80 py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left lg:px-8">
        <div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Lakshmi Chakradhar Vijayarao.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Built with Next.js, Tailwind CSS, and ❤️.
          </p>
        </div>
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
