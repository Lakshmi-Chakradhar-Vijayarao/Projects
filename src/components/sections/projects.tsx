
"use client";

import React from 'react';
import { useInView } from 'react-intersection-observer';
import ProjectCard from '@/components/project-card';
import { SectionWrapper } from '@/components/ui/section-wrapper';

const projectsData = [
  {
    title: "AI-Powered Smart Detection of Crops and Weeds",
    date: "2023",
    description: "Developed a deep learning solution (YOLO architecture) achieving 90% accuracy in distinguishing crops from weeds in agricultural settings. Processed over 10,000 images and established scalable real-time inference pipelines, contributing to a potential 15% reduction in herbicide usage.",
    technologies: ["Python", "YOLO", "Object Detection", "OpenCV", "TensorFlow"],
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=640&auto=format",
    imageHint: "agriculture technology",
    projectUrl: "#", 
  },
  {
    title: "Search Engine for Movie Summaries",
    date: "2022",
    description: "Built a scalable search engine to find relevant movies based on plot summaries and themes. Leveraged distributed computing frameworks like PySpark and Databricks, improving query relevance by 10% across a dataset of over 100,000 movie records.",
    technologies: ["Python", "PySpark", "Databricks", "NLP", "Hadoop"],
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=640&auto=format",
    imageHint: "data search",
    projectUrl: "#",
  },
  {
    title: "Facial Recognition Attendance System",
    date: "2022",
    description: "Created a real-time facial recognition system achieving 99% accuracy for automated attendance tracking for over 200 users. The system was linked to cloud storage for real-time data synchronization, reducing manual errors by 30%.",
    technologies: ["Python", "OpenCV", "Machine Learning", "Face Recognition"],
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=640&auto=format",
    imageHint: "security face recognition",
    projectUrl: "#",
  },
  {
    title: "Mushroom Classification using Scikit-Learn",
    date: "2021",
    description: "Trained and evaluated ensemble machine learning models (Decision Tree, Random Forest, KNN) to classify mushroom edibility with 95% accuracy. Enhanced data reliability by effectively preprocessing a dataset with 20% missing values.",
    technologies: ["Python", "Scikit-Learn", "Decision Tree", "Random Forest", "KNN"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=640&auto=format",
    imageHint: "nature classification",
    projectUrl: "#",
  },
  {
    title: "Custom Linux Process Scheduler Development",
    date: "2021",
    description: "Developed and implemented custom priority-based and lottery-based process schedulers for the xv6 operating system. This resulted in an 18% reduction in context switching overhead, validated through comprehensive simulations.",
    technologies: ["C", "C++", "Linux Kernel", "xv6", "OS Development"],
    image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=640&auto=format",
    imageHint: "computing programming",
    projectUrl: "#",
  }
];

const Projects: React.FC = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <SectionWrapper id="projects" title="My Projects" className="bg-background/50">
      <div 
        ref={ref}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {projectsData.map((project, index) => (
          <ProjectCard 
            key={project.title}
            {...project}
            index={index}
            inView={inView}
          />
        ))}
      </div>
    </SectionWrapper>
  );
};

export default Projects;
