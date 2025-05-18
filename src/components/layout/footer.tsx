
import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react';
import Link from 'next/link';

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/Lakshmi-Chakradhar-Vijayarao', icon: Github },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/lakshmichakradharvijayarao/', icon: Linkedin },
  { name: 'Email', href: 'mailto:lakshmichakradhar.v@gmail.com', icon: Mail },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border/50 bg-background/95 py-8 text-sm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6 text-center md:text-left">
          <p className="text-primary font-semibold text-base">
            “Let’s build something impactful together.”
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
        <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {currentYear} Lakshmi Chakradhar Vijayarao. All rights reserved.</p>
          <div className="flex space-x-4 items-center">
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="#hero" className="hover:text-primary transition-colors flex items-center">
              Back to top <ArrowUp className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

