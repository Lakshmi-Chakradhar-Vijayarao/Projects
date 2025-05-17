import Hero from '@/components/sections/hero';
import AboutMe from '@/components/sections/about-me';
import Projects from '@/components/sections/projects';
import Experience from '@/components/sections/experience';
import Contact from '@/components/sections/contact';

export default function Home() {
  return (
    <>
      <Hero />
      <AboutMe />
      <Projects />
      <Experience />
      <Contact />
    </>
  );
}
