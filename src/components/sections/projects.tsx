"use client";

import React from 'react';
import { useInView } from 'react-intersection-observer';
import ProjectCard from '@/components/project-card'; // Corrected import path
import { SectionWrapper } from '@/components/ui/section-wrapper';

const projectsData = [
  {
    title: "AI-Powered Smart Detection of Crops and Weeds",
    date: "2023",
    description: "Developed a deep learning solution achieving 90% accuracy in distinguishing crops from weeds in agricultural settings using YOLO architecture. Processed 10,000+ images, established scalable real-time inference pipelines, reducing herbicide usage by 15%.",
    technologies: ["YOLO", "Python", "OpenCV", "TensorFlow"],
    image: "https://placehold.co/600x400.png", // Using placeholder
    imageHint: "agriculture technology",
    projectUrl: "#",
  },
  {
    title: "Search Engine for Movie Summaries",
    date: "2022",
    description: "Built a scalable search engine to find relevant movies based on plot summaries and themes using distributed computing frameworks like PySpark and Databricks. Improved query relevance by 10% for 100,000+ records.",
    technologies: ["Python", "PySpark", "Databricks", "NLP", "Hadoop"],
    image: "https://placehold.co/600x400.png", // Using placeholder
    imageHint: "data search",
    projectUrl: "#",
  },
  {
    title: "Facial Recognition Attendance System",
    date: "2022",
    description: "Created a real-time facial recognition system with 99% accuracy for automated attendance tracking for 200+ users. Linked to cloud storage for real-time data syncing, reducing errors by 30%.",
    technologies: ["OpenCV", "Python", "Machine Learning", "Face Recognition"],
    image: "https://placehold.co/600x400.png", // Using placeholder
    imageHint: "face recognition security",
    projectUrl: "#",
  },
  {
    title: "Mushroom Classification using Scikit-Learn",
    date: "2021",
    description: "Trained and evaluated ensemble models (Decision Tree, Random Forest, KNN) achieving 95% accuracy. Enhanced reliability by preprocessing 20% missing data in the dataset.",
    technologies: ["Scikit-Learn", "Python", "Ensemble ML", "Data Analysis"],
    image: "https://placehold.co/600x400.png", // Using placeholder
    imageHint: "nature classification",
    projectUrl: "#",
  },
  {
    title: "Custom Linux Process Scheduler",
    date: "2021",
    description: "Developed custom priority and lottery schedulers for the xv6 operating system, reducing context switching overhead by 18%. Validated fairness and efficiency with simulations.",
    technologies: ["C", "C++", "xv6", "Linux Kernel", "OS Development"],
    image: "https://placehold.co/600x400.png", // Using placeholder
    imageHint: "computing programming",
    projectUrl: "#",
  }
];

const Projects: React.FC = () => {
  const { ref, inView } = useInView({
    threshold: 0.1, // Trigger when 10% of the element is visible
    triggerOnce: true, // Animate only once
  });

  return (
    <SectionWrapper id="projects" title="My Projects" className="bg-secondary">
      <div 
        ref={ref} // Apply ref to the grid container
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {projectsData.map((project, index) => (
          <ProjectCard 
            key={project.title}
            {...project}
            index={index}
            inView={inView} // Pass inView status to each card
          />
        ))}
      </div>
    </SectionWrapper>
  );
};

export default Projects;
