import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section 
      id="hero" 
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center py-20 text-center text-primary-foreground overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(220, 70%, 50%), hsl(270, 60%, 55%))'
      }}
    >
      <div className="absolute inset-0 bg-black/30 z-0"></div>
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-md">
          Lakshmi Chakradhar Vijayarao
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-primary-foreground/90 drop-shadow-sm">
          Software Engineer | ML Practitioner | Scalable & Secure Systems Engineer
        </p>
        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-transform hover:scale-105 shadow-lg">
            <Link href="#about">
              Discover More <ArrowDown className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
       <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10"></div>
    </section>
  );
}
