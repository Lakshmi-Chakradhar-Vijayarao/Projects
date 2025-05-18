
import Hero from '@/components/sections/hero';
import AboutMe from '@/components/sections/about-me';
// Summary component was effectively merged into AboutMe or replaced by it
import Skills from '@/components/sections/skills';
import Projects from '@/components/sections/projects';
import Experience from '@/components/sections/experience';
import Education from '@/components/sections/education';
import Certifications from '@/components/sections/certifications';
import Publication from '@/components/sections/publication'; 
import Contact from '@/components/sections/contact';

export default function Home() {
  return (
    <>
      <Hero />
      <AboutMe /> {/* Updated AboutMe replaces/incorporates previous Summary concept */}
      <Experience />
      <Projects />
      <Skills /> 
      <Education />
      <Certifications />
      <Publication />
      <Contact />
    </>
  );
}

