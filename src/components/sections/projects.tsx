import ProjectCard from '@/components/project-card';
import { SectionWrapper } from '@/components/ui/section-wrapper';

const projectsData = [
  {
    title: 'AI-Powered Smart Detection of Crops and Weeds',
    description: 'Built a YOLO-based object detection model (90% accuracy) for classifying crop/weed species, reducing herbicide usage by 15%. Processed 10,000+ images, established scalable real-time inference pipelines.',
    technologies: ['Python', 'YOLO', 'Object Detection', 'OpenCV'],
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'agriculture technology',
  },
  {
    title: 'Search Engine for Movie Summaries',
    description: 'Developed a distributed search engine using TF-IDF and cosine similarity, improving query relevance by 10%. Deployed on Hadoop & Databricks to manage 100,000+ records.',
    technologies: ['Python', 'PySpark', 'Databricks', 'Scala', 'Hadoop', 'TF-IDF'],
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'data search',
  },
  {
    title: 'Facial Recognition Attendance System',
    description: 'Designed a facial recognition system (99% accuracy for 200+ users), reducing attendance tracking errors by 30%. Linked to cloud storage for real-time data syncing & secure logging.',
    technologies: ['Python', 'OpenCV', 'Machine Learning', 'Face Recognition'],
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'face recognition security',
  },
  {
    title: 'Mushroom Classification using Scikit-Learn',
    description: 'Trained and evaluated ensemble models (Decision Tree, Random Forest, KNN) achieving 95% accuracy with cross-validation. Enhanced reliability by preprocessing 20% missing data.',
    technologies: ['Python', 'Scikit-Learn', 'Decision Tree', 'Random Forest', 'KNN'],
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'nature classification',
  },
  {
    title: 'Custom Process Scheduler Development',
    description: 'Programmed custom priority and lottery schedulers for Linux (xv6), reducing context switching overhead by 18%. Validated fairness and efficiency with synthetic workload simulations.',
    technologies: ['Linux Kernel', 'xv6', 'C', 'C++'],
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'computing programming',
  },
];

export default function Projects() {
  return (
    <SectionWrapper id="projects" title="My Projects" className="bg-secondary">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projectsData.map((project) => (
          <ProjectCard key={project.title} {...project} />
        ))}
      </div>
    </SectionWrapper>
  );
}
