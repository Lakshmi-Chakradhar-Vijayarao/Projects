
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
  },
];

export default function Experience() {
  return (
    <SectionWrapper id="experience" title="My Experience">
      <div className="relative space-y-12">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-border/50 rounded-full md:left-1/2 md:-translate-x-1/2"></div>
        
        {experienceData.map((exp, index) => (
          <div key={exp.company} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
            <div className="hidden md:flex md:w-1/2"></div> {/* Spacer for desktop */}
            <div className={`relative z-10 md:w-1/2 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
              <div className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-md
                              ${index % 2 === 0 ? 'md:right-[-30px] left-[-22px] md:left-auto' : 'md:left-[-30px] left-[-22px]'}`}>
              </div>
              <ExperienceItem {...exp} />
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

