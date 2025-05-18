import ExperienceItem from '@/components/experience-item';
import { SectionWrapper } from '@/components/ui/section-wrapper';

const experienceData = [
  {
    title: 'Internship Project Trainee',
    company: 'NSIC Technical Services Centre, Chennai, India',
    duration: 'Apr 2023 – Jun 2023',
    descriptionPoints: [
      'Developed and deployed a responsive e-commerce platform using React.js for the frontend and Node.js with Express.js for the backend, connected to a MySQL database, leading to a 20% increase in simulated user engagement.',
      'Implemented secure user authentication and authorization mechanisms using OAuth2 and JWT, which reduced potential session-related errors by 25%.',
      'Contributed to training materials and assisted in delivering Android full-stack development sessions for over 30 students, resulting in a 95% completion rate.',
    ],
  },
  {
    title: 'Summer Internship Project Associate',
    company: 'Zoho Corporation Private Limited, Chennai, India',
    duration: 'Mar 2022 – Apr 2022',
    descriptionPoints: [
      'Focused on optimizing backend performance for a video conferencing application by refining API calls and tuning SQL queries, improving data retrieval times.',
      'Integrated WebRTC functionalities to enhance real-time audio-video communication, supporting low-latency interactions for up to 1,000 concurrent users.',
      'Collaborated within an Agile framework with QA and product teams to develop, test, and release reliable and scalable application features.',
    ],
  },
];

export default function Experience() {
  return (
    <SectionWrapper id="experience" title="My Experience">
      <div className="relative space-y-12">
        {/* Timeline line - ensure visibility against dark background */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-border/50 rounded-full md:left-1/2 md:-translate-x-1/2"></div>
        
        {experienceData.map((exp, index) => (
          <div key={exp.company} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
            <div className="hidden md:flex md:w-1/2"></div> {/* Spacer for desktop */}
            <div className={`relative z-10 md:w-1/2 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
               {/* Dot on timeline */}
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
