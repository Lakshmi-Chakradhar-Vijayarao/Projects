
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image'; // Using standard Image for a sleek look

export default function Hero() {
  return (
    <section
      id="hero"
      className="bg-gradient-to-br from-background via-primary/10 to-secondary/10 text-foreground min-h-[calc(100vh-4rem)] flex items-center py-16 lg:py-20 overflow-hidden animate-bg-pan bg-[length:200%_200%]"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-16">
        {/* Left Text Content */}
        <div className="lg:w-7/12 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            Lakshmi Chakradhar Vijayarao
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-primary mb-8">
            ML Practitioner | Scalable & Secure Systems Engineer
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0">
            Crafting intelligent solutions and robust applications with a focus on performance, security, and user experience.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg transition-transform hover:scale-105 rounded-lg text-base md:text-lg px-8 py-3"
          >
            <Link href="#contact">
              Get In Touch
            </Link>
          </Button>
        </div>

        {/* Right Visual Content - Placeholder for a sleek design element or professional image */}
        <div className="lg:w-4/12 flex justify-center lg:justify-end order-first lg:order-last">
           <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden shadow-2xl border-4 border-primary/30 bg-card flex items-center justify-center">
            <Image 
              src="https://placehold.co/400x400.png"
              alt="Abstract representation of technology"
              width={400}
              height={400}
              className="object-cover opacity-30"
              data-ai-hint="abstract technology"
              priority
            />
            <span className="absolute text-6xl font-mono text-primary opacity-80 select-none">LCV</span>
          </div>
        </div>
      </div>
    </section>
  );
}
