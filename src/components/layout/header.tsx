"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Briefcase, User, Code, MessageSquare, Brain } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '#about', label: 'About', icon: <User className="h-4 w-4" /> },
  { href: '#projects', label: 'Projects', icon: <Code className="h-4 w-4" /> },
  { href: '#experience', label: 'Experience', icon: <Briefcase className="h-4 w-4" /> },
  { href: '#contact', label: 'Contact', icon: <MessageSquare className="h-4 w-4" /> },
  { href: '/tone-analyzer', label: 'Tone Analyzer', icon: <Brain className="h-4 w-4" />, newTab: false },
];

export default function Header() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-primary">
            Lakshmi's Launchpad
          </Link>
        </div>
      </header>
    ); // Render a basic header or null during hydration
  }
  
  const NavLinks = ({ inSheet = false }: { inSheet?: boolean }) => (
    <>
      {navItems.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          asChild
          className={`justify-start ${inSheet ? 'w-full' : ''}`}
          onClick={() => inSheet && setMobileMenuOpen(false)}
        >
          <Link href={item.href} target={item.newTab ? '_blank' : '_self'}>
            {item.icon}
            <span className="ml-2">{item.label}</span>
          </Link>
        </Button>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link 
          href="/" 
          className="text-xl font-bold text-primary hover:text-primary/90 transition-all duration-300 ease-in-out hover:scale-[1.03] inline-block"
        >
          Lakshmi Chakradhar Vijayarao
        </Link>
        {isMobile ? (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <nav className="flex flex-col space-y-2 pt-6">
                <NavLinks inSheet={true} />
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="flex items-center space-x-2">
            <NavLinks />
          </nav>
        )}
      </div>
    </header>
  );
}
