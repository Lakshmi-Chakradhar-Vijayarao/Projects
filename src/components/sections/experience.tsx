
import ExperienceItem from '@/components/experience-item';
import { SectionWrapper } from '@/components/ui/section-wrapper';

const experienceData = [
  {
    title: 'Internship Project Trainee',
    company: 'NSIC Technical Services Centre, Chennai, India',
    duration: 'Apr 2023 – Jun 2023',
    descriptionPoints: [
      'Developed full-stack e-commerce platform (React.js, Node.js, MySQL).',
      'Enhanced login security with JWT + OAuth2.',
      'Conducted Android full-stack training for 30+ learners.',
    ],
    logoSrc: "/logos/nsic.png",
    logoAlt: "NSIC Logo",
    dataAiHint: "nsic",
  },
  {
    title: 'Summer Internship Project Associate',
    company: 'Zoho Corporation Private Limited, Chennai, India',
    duration: 'Mar 2022 – Apr 2022',
    descriptionPoints: [
      'Optimized backend API and SQL performance for a video conferencing application.',
      'Integrated WebRTC for 1,000+ real-time users.',
      'Participated in Agile sprints with QA and product teams.',
    ],
    logoSrc: "/logos/zoho.png",
    logoAlt: "Zoho Logo",
    dataAiHint: "zoho",
  },
];

export default function Experience() {
  return (
    <SectionWrapper id="experience" title="My Experience">
      <div className="space-y-8"> {/* Changed from grid to space-y for row layout */}
        {experienceData.map((exp, index) => (
          <ExperienceItem 
            key={exp.company + exp.title + index} // Added index to key for more uniqueness if titles/companies were ever identical
            {...exp} 
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
