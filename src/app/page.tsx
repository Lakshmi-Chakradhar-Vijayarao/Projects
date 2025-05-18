
import Hero from '@/components/sections/hero';
import AboutMe from '@/components/sections/about-me';
// import Summary from '@/components/sections/summary'; // Removed
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
      {/* <Summary /> */} {/* Removed */}
      <AboutMe />
      <Skills />
      <Experience />
      <Projects />
      <Education />
      <Certifications />
      <Publication />
      <Contact />
    </>
  );
}
