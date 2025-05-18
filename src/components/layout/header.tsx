"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Briefcase, User, Code, MessageSquare, Brain, HomeIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '#hero', label: 'Home', icon: <HomeIcon className="h-4 w-4" /> },
  { href: '#about', label: 'About', icon: <User className="h-4 w-4" /> },
  { href: '#projects', label: 'Projects', icon: <Code className="h-4 w-4" /> },
  { href: '#experience', label: 'Experience', icon: <Briefcase className="h-4 w-4" /> },
  { href: '#contact', label: 'Contact', icon: <MessageSquare className="h-4 w-4" /> },
  { href: '/tone-analyzer', label: 'Tone Analyzer', icon: <Brain className="h-4 w-4" />, newTab: false }, // Kept as an example tool
];

export default function Header() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const siteTitle = "Lakshmi C. Vijayarao";

  if (!mounted) {
    // Consistent SSR/initial client render
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-primary hover:text-primary/90 transition-colors">
            {siteTitle}
          </Link>
          {/* Placeholder for nav items to avoid layout shift, or simple menu icon */}
           <div className="md:hidden">
            <Button variant="outline" size="icon" disabled>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button key={item.label} variant="ghost" asChild className="text-sm">
                <Link href={item.href} target={item.newTab ? '_blank' : '_self'}>
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </header>
    ); 
  }
  
  const NavLinks = ({ inSheet = false }: { inSheet?: boolean }) => (
    <>
      {navItems.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          asChild
          className={`justify-start text-sm ${inSheet ? 'w-full text-base py-3' : ''}`}
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link 
          href="/" 
          className="text-xl font-bold text-primary hover:text-primary/90 transition-all duration-300 ease-in-out hover:scale-[1.03] inline-block"
        >
          {siteTitle}
        </Link>
        {isMobile ? (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-background p-6">
              <nav className="flex flex-col space-y-2 pt-6">
                <NavLinks inSheet={true} />
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="flex items-center space-x-1">
            <NavLinks />
          </nav>
        )}
      </div>
    </header>
  );
}
