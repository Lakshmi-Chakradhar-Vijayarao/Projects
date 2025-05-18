
"use client";

import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import ProjectCard from '@/components/project-card';
import { SectionWrapper } from '@/components/ui/section-wrapper';
import { Button } from '@/components/ui/button';

// projectsData is now defined locally and not exported
const projectsData = [
  {
    title: "AI-Powered Smart Detection of Crops and Weeds",
    date: "2023",
    description: "Built a YOLO-based object detection model (90% accuracy) for classifying crop and weed species, reducing herbicide usage by 15%. Processed 10,000+ agricultural images and established scalable inference pipelines for real-time analysis.",
    technologies: ["Python", "YOLO", "Object Detection", "TensorFlow"],
    image: "https://placehold.co/640x400.png",
    imageHint: "agriculture technology",
    projectUrl: "#",
    categories: ["AI/ML"],
  },
  {
    title: "Search Engine for Movie Summaries",
    date: "2022",
    description: "Developed a distributed search engine leveraging TF-IDF and cosine similarity to improve query relevance by 10%. Deployed on Hadoop and Databricks to manage 100,000+ records efficiently.",
    technologies: ["Python", "PySpark", "Databricks", "Hadoop", "Scala", "NLP"],
    image: "https://placehold.co/640x400.png",
    imageHint: "data search",
    projectUrl: "#",
    categories: ["Big Data", "AI/ML"],
  },
  {
    title: "Facial Recognition Attendance System",
    date: "2022",
    description: "Designed a facial recognition system with 99% accuracy for 200+ users, reducing attendance tracking errors by 30%. Linked to cloud storage for real-time data syncing and secure logging.",
    technologies: ["Python", "OpenCV", "Machine Learning", "Cloud"],
    image: "https://placehold.co/640x400.png",
    imageHint: "security face recognition",
    projectUrl: "#",
    categories: ["AI/ML"],
  },
  {
    title: "Mushroom Classification using Scikit-Learn",
    date: "2021",
    description: "Trained and evaluated ensemble models (Decision Tree, Random Forest, KNN), achieving 95% accuracy using cross-validation. Enhanced reliability through preprocessing techniques to address 20% missing data.",
    technologies: ["Python", "Scikit-Learn", "DT Classifier", "RF Classifier", "KNN"],
    image: "https://placehold.co/640x400.png",
    imageHint: "nature classification",
    projectUrl: "#",
    categories: ["AI/ML"],
  },
  {
    title: "Custom Process Scheduler Development",
    date: "2021",
    description: "Programmed custom priority and lottery schedulers in xv6/Linux kernel, reducing context switching overhead by 18%. Validated algorithm fairness and efficiency with synthetic workload simulations.",
    technologies: ["Linux Kernel", "xv6", "C", "C++", "OS Development"],
    image: "https://placehold.co/640x400.png",
    imageHint: "computing programming",
    projectUrl: "#",
    categories: ["Systems"],
  },
  {
    title: "Personal Portfolio Website",
    date: "2024",
    description: "Developed a responsive personal portfolio using Next.js, React, and Tailwind CSS to showcase skills and projects.",
    technologies: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
    image: "https://placehold.co/640x400.png",
    imageHint: "web design",
    projectUrl: "#", // Example link, update as needed
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
    <SectionWrapper id="projects" title="My Projects" className="bg-background/50">
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {filterCategories.map((category) => (
          <Button
            key={category}
            variant={activeFilter === category ? "default" : "outline"}
            onClick={() => setActiveFilter(category)}
            className="transition-all duration-200 ease-in-out hover:scale-105"
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
            key={project.title + index} // Ensure key is unique if titles can repeat
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
