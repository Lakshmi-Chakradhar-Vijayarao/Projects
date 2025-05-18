
"use client";

import React from 'react';
import { useInView } from 'react-intersection-observer';
import ProjectCard from '@/components/project-card';
import { SectionWrapper } from '@/components/ui/section-wrapper';

// Exporting projectsData to be used by the chat assistant
export const projectsData = [
  {
    title: "AI-Powered Smart Detection of Crops and Weeds",
    date: "2023",
    description: "Developed an advanced deep learning solution leveraging the YOLO (You Only Look Once) architecture, achieving 90% accuracy in distinguishing crops from weeds in diverse agricultural settings. This system processed over 10,000 images and involved establishing scalable real-time inference pipelines. Its implementation contributes to precision agriculture, potentially reducing herbicide usage by up to 15% and promoting sustainable farming practices.",
    technologies: ["Python", "YOLO", "Object Detection", "OpenCV", "TensorFlow", "Deep Learning"],
    image: "https://placehold.co/640x400.png",
    imageHint: "agriculture technology",
    projectUrl: "#", 
  },
  {
    title: "Search Engine for Movie Summaries",
    date: "2022",
    description: "Built a robust and scalable search engine designed to help users find relevant movies based on intricate plot summaries and thematic elements. This project utilized distributed computing frameworks like PySpark and Databricks to efficiently process and index a large dataset of over 100,000 movie records, achieving a 10% improvement in query relevance and search speed.",
    technologies: ["Python", "PySpark", "Databricks", "NLP", "Hadoop", "Search Algorithms"],
    image: "https://placehold.co/640x400.png",
    imageHint: "data search",
    projectUrl: "#",
  },
  {
    title: "Facial Recognition Attendance System",
    date: "2022",
    description: "Engineered a real-time facial recognition system that attained 99% accuracy for automated attendance tracking across a user base of over 200 individuals. The system was seamlessly integrated with cloud storage solutions for real-time data synchronization and reporting, significantly reducing manual data entry errors by 30% and improving administrative efficiency.",
    technologies: ["Python", "OpenCV", "Machine Learning", "Face Recognition", "Cloud Storage"],
    image: "https://placehold.co/640x400.png",
    imageHint: "security face recognition",
    projectUrl: "#",
  },
  {
    title: "Mushroom Classification using Scikit-Learn",
    date: "2021",
    description: "Trained, validated, and deployed ensemble machine learning models, including Decision Trees, Random Forests, and K-Nearest Neighbors (KNN), to classify mushroom edibility with a high accuracy of 95%. This project involved significant data preprocessing to enhance data reliability from a dataset with 20% missing values, ensuring robust model performance.",
    technologies: ["Python", "Scikit-Learn", "Decision Tree", "Random Forest", "KNN", "Data Preprocessing"],
    image: "https://placehold.co/640x400.png",
    imageHint: "nature classification",
    projectUrl: "#",
  },
  {
    title: "Custom Linux Process Scheduler Development",
    date: "2021",
    description: "Designed, developed, and implemented custom priority-based and lottery-based process schedulers for the xv6 operating system, a teaching OS based on Sixth Edition Unix. This kernel-level development resulted in an 18% reduction in context switching overhead and improved system responsiveness, validated through comprehensive simulations and performance testing.",
    technologies: ["C", "C++", "Linux Kernel", "xv6", "OS Development", "Process Scheduling"],
    image: "https://placehold.co/640x400.png",
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
