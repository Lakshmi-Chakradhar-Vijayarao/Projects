
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

export const projectsData: Project[] = [
  {
    title: "AI-Powered Smart Detection of Crops and Weeds",
    date: "Ongoing",
    description: "Developed a deep learning solution achieving over 90% accuracy in distinguishing crops from weeds, optimizing herbicide usage and promoting sustainable agriculture.",
    technologies: ["Python", "YOLO", "Object Detection", "TensorFlow", "OpenCV"],
    image: "https://source.unsplash.com/640x400/?agriculture technology",
    imageHint: "agriculture technology",
    projectUrl: "#",
    categories: ["AI/ML"],
  },
  {
    title: "Search Engine for Movie Summaries",
    date: "2023",
    description: "Built a scalable search engine using TF-IDF and cosine similarity on PySpark and Hadoop, efficiently querying over 100,000 movie records.",
    technologies: ["Python", "PySpark", "Databricks", "Hadoop", "Scala", "NLP"],
    image: "https://source.unsplash.com/640x400/?data search movie",
    imageHint: "data search movie",
    projectUrl: "#",
    categories: ["Big Data", "AI/ML"],
  },
  {
    title: "Facial Recognition Attendance System",
    date: "2023",
    description: "Designed a real-time facial recognition system with 99% accuracy for automated attendance, featuring cloud-synced data logging for over 200 users.",
    technologies: ["Python", "OpenCV", "Machine Learning", "Cloud API"],
    image: "https://source.unsplash.com/640x400/?security face recognition",
    imageHint: "security face recognition",
    projectUrl: "#",
    categories: ["AI/ML"],
  },
  {
    title: "Mushroom Classification with Scikit-Learn",
    date: "2022",
    description: "Implemented ensemble machine learning models (Decision Tree, Random Forest, KNN) achieving 95% accuracy in classifying mushroom species from feature data.",
    technologies: ["Python", "Scikit-Learn", "Decision Tree", "Random Forest", "KNN"],
    image: "https://source.unsplash.com/640x400/?nature classification mushroom",
    imageHint: "nature classification mushroom",
    projectUrl: "#",
    categories: ["AI/ML"],
  },
  {
    title: "Custom Process Scheduler Development",
    date: "2022",
    description: "Engineered custom priority and lottery-based schedulers for the xv6/Linux kernel, reducing context switching overhead by 18%.",
    technologies: ["Linux Kernel", "xv6", "C", "C++", "OS Development"],
    image: "https://source.unsplash.com/640x400/?computing programming kernel",
    imageHint: "computing programming kernel",
    projectUrl: "#",
    categories: ["Systems"],
  },
  {
    title: "Personal Portfolio Website",
    date: "2024",
    description: "The very website you're looking at! Built with Next.js, React, TypeScript, Tailwind CSS, and integrated AI features.",
    technologies: ["Next.js", "React", "Tailwind CSS", "TypeScript", "Genkit"],
    image: "https://source.unsplash.com/640x400/?web design portfolio",
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
