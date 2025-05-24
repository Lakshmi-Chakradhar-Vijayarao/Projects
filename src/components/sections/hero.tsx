"use client";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// AnimatedAvatar import is removed as it's no longer used here
import { Download, Send, Linkedin, Github } from 'lucide-react';

export default function Hero() {
  return (
    <section
      id="hero"
      className="bg-gradient-to-br from-background via-primary/5 to-secondary/5 text-foreground min-h-[calc(100vh-4rem)] flex items-center justify-center py-16 lg:py-20 overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Text Content - Now takes full width or is centered */}
        <div className="lg:w-9/12 xl:w-8/12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-primary">
            Lakshmi Chakradhar Vijayarao
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground/80 mb-6">
            Software Engineer | ML Practitioner | Full-Stack Developer
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Building intelligent, scalable solutions that drive real impact for Chakradhar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold shadow-lg transition-transform hover:scale-105 rounded-lg text-base px-6 py-3 w-full sm:w-auto"
            >
              <a href="/Lakshmi_resume.pdf" target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-5 w-5" /> Download Resume
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-semibold shadow-lg transition-transform hover:scale-105 rounded-lg text-base px-6 py-3 w-full sm:w-auto"
            >
              <Link href="#contact">
                <Send className="mr-2 h-5 w-5" /> Contact Me
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex justify-center space-x-4">
            <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-accent">
              <Link href="https://www.linkedin.com/in/lakshmichakradharvijayarao/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className="h-6 w-6" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-accent">
              <Link href="https://github.com/Lakshmi-Chakradhar-Vijayarao" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
        {/* AnimatedAvatar component removed from here */}
      </div>
    </section>
  );
}
