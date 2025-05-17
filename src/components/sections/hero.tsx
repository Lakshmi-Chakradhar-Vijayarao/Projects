import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section
      id="hero"
      className="bg-gradient-to-br from-neutral-950 via-slate-900 to-neutral-950 text-white min-h-[calc(100vh-4rem)] flex items-center py-16 lg:py-20 overflow-hidden animate-bg-pan bg-[length:200%_200%]"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-16">
        {/* Left Text Content */}
        <div className="lg:w-7/12 text-center lg:text-left order-2 lg:order-1">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-3">
            Lakshmi Chakradhar Vijayarao
          </h1>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Full Stack Engineer & <span className="text-lime-400">AI Innovator</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-10">
            I build robust, scalable web applications and leverage machine learning to create intelligent, impactful solutions. Let&apos;s connect and bring your ideas to life.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold shadow-lg transition-transform hover:scale-105 rounded-lg text-base md:text-lg px-8 py-3"
          >
            <Link href="#contact">
              Get In Touch
            </Link>
          </Button>
        </div>

        {/* Right Image Content */}
        <div className="lg:w-5/12 flex justify-center lg:justify-end order-1 lg:order-2">
          <div className="relative group w-[280px] h-[350px] sm:w-[320px] sm:h-[400px] md:w-[360px] md:h-[450px] lg:w-[400px] lg:h-[500px] xl:w-[450px] xl:h-[560px] rounded-xl overflow-hidden shadow-2xl border-4 border-zinc-700/50">
            <Image
              src="https://placehold.co/500x600.png"
              alt="Lakshmi Chakradhar Vijayarao"
              layout="fill"
              objectFit="cover"
              priority
              className="transform transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint="professional portrait"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
