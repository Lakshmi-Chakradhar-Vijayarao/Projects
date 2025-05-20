"use client";
import type { ReactNode } from 'react';
// import { useScrollReveal } from '@/hooks/useScrollReveal'; // Temporarily disable
import { cn } from '@/lib/utils';

interface SectionWrapperProps {
  id: string;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function SectionWrapper({ id, children, className, title }: SectionWrapperProps) {
  // const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.1, once: true }); // Temporarily disable

  return (
    <section
      id={id}
      // ref={ref} // Temporarily disable
      className={cn(
        'py-16 sm:py-24', // Removed animation classes: transition-all duration-1000 ease-out transform
        // isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12', // Temporarily disable
        'opacity-100 translate-y-0', // Render immediately visible
        className
      )}
    >
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-12 text-center">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}
