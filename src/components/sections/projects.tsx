
"use client";

import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import ProjectCard from '@/components/project-card';
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface Project {
  title: string;
  date: string;
  description: string;
  technologies: string[];
  image: string;
  imageHint: string; 
  projectUrl: string;
  categories: string[];
  icon?: LucideIcon | React.ElementType;
}

// This data is now local to this component.
const projectsData: Project[] = [
  {
    title: "AI-Powered Smart Detection of Crops and Weeds",
    date: "2023",
    description: "Built a YOLO-based object detection model with 90% accuracy for classifying crop and weed species, reducing herbicide usage by 15%. Processed 10,000+ agricultural images for real-time analysis.",
    technologies: ["Python", "YOLO", "Object Detection", "TensorFlow", "OpenCV"],
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=640&auto=format",
    imageHint: "agriculture technology",
    projectUrl: "#",
    categories: ["AI/ML"],
  },
  {
    title: "Search Engine for Movie Summaries",
    date: "2023",
    description: "Developed a distributed search engine leveraging TF-IDF and cosine similarity to improve query relevance by 10%. Deployed on Hadoop and Databricks to manage 100,000+ records.",
    technologies: ["Python", "PySpark", "Databricks", "Hadoop", "Scala", "NLP"],
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=640&auto=format",
    imageHint: "data search movie",
    projectUrl: "#",
    categories: ["Big Data", "AI/ML"],
  },
  {
    title: "Facial Recognition Attendance System",
    date: "2022",
    description: "Designed a facial recognition system with 99% accuracy for 200+ users, reducing attendance tracking errors by 30%. Linked to cloud storage for real-time data syncing.",
    technologies: ["Python", "OpenCV", "Machine Learning", "Cloud API"],
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=640&auto=format",
    imageHint: "security face recognition",
    projectUrl: "#",
    categories: ["AI/ML"],
  },
  {
    title: "Mushroom Classification with Scikit-Learn",
    date: "2022",
    description: "Trained and evaluated ensemble models (Decision Tree, Random Forest, KNN), achieving 95% accuracy using cross-validation. Enhanced reliability through preprocessing for missing data.",
    technologies: ["Python", "Scikit-Learn", "Decision Tree", "Random Forest", "KNN"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=640&auto=format",
    imageHint: "nature classification mushroom",
    projectUrl: "#",
    categories: ["AI/ML"],
  },
  {
    title: "Custom Process Scheduler Development",
    date: "2021",
    description: "Programmed custom priority and lottery schedulers for the xv6/Linux kernel, reducing context switching overhead by 18%. Validated algorithm fairness with simulations.",
    technologies: ["Linux Kernel", "xv6", "C", "C++", "OS Development"],
    image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=640&auto=format",
    imageHint: "computing programming kernel",
    projectUrl: "#",
    categories: ["Systems"],
  },
  {
    title: "Personal Portfolio Website",
    date: "2024",
    description: "The very website you're looking at! Built with Next.js, React, Tailwind CSS, and TypeScript, showcasing my skills and projects.",
    technologies: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=640&auto=format",
    imageHint: "web design portfolio",
    projectUrl: "#",
    categories: ["Web Dev"],
  }
];

const filterCategories = ["All", "AI/ML", "Web Dev", "Big Data", "Systems"];

const Projects: React.FC = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredProjects = activeFilter === "All"
    ? projectsData
    : projectsData.filter(project => project.categories.includes(activeFilter));

  return (
    <SectionWrapper id="projects" title="My Projects" className="bg-background/95">
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {filterCategories.map((category) => (
          <Button
            key={category}
            variant={activeFilter === category ? "default" : "outline"}
            onClick={() => setActiveFilter(category)}
            className="transition-all duration-200 ease-in-out hover:scale-105 rounded-lg"
          >
            {category}
          </Button>
        ))}
      </div>
      <div
        ref={ref}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {filteredProjects.map((project, index) => (
          <ProjectCard
            key={project.title + index}
            {...project}
            index={index}
            inView={inView}
          />
        ))}
      </div>
      {filteredProjects.length === 0 && (
        <p className="text-center text-muted-foreground mt-8">No projects found for the selected filter.</p>
      )}
    </SectionWrapper>
  );
};

export default Projects;
// No longer exporting projectsData as it's used locally
// export { projectsData };

