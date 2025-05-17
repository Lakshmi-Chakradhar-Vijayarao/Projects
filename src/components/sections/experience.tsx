import ExperienceItem from '@/components/experience-item';
import { SectionWrapper } from '@/components/ui/section-wrapper';

const experienceData = [
  {
    title: 'Internship Project Trainee',
    company: 'NSIC Technical Services Centre, Chennai, India',
    duration: 'Apr 2023 – Jun 2023',
    descriptionPoints: [
      'Constructed a responsive e-commerce platform using React.js, Node.js, and MySQL, increasing user engagement by 20%.',
      'Implemented OAuth2 and JWT-based authentication, reducing session errors by 25% and enhancing login reliability.',
      'Facilitated Android full-stack training for 30+ students, achieving a 95% pass rate and boosting job placement outcomes by 40%.',
    ],
  },
  {
    title: 'Summer Internship Project Associate',
    company: 'Zoho Corporation Private Limited, Chennai, India',
    duration: 'Mar 2022 – Apr 2022',
    descriptionPoints: [
      'Streamlined backend performance by refining API calls and optimizing SQL queries in a video conferencing application.',
      'Integrated WebRTC for low-latency communication, enhancing real-time interaction for 1,000+ concurrent users.',
      'Partnered with QA and product teams in Agile sprints to release reliable, scalable features.',
    ],
  },
];

export default function Experience() {
  return (
    <SectionWrapper id="experience" title="My Experience">
      <div className="relative space-y-12">
        {/* Timeline line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-border rounded-full md:left-1/2 md:-translate-x-1/2"></div>
        
        {experienceData.map((exp, index) => (
          <div key={exp.company} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
            <div className="hidden md:flex md:w-1/2"></div> {/* Spacer for desktop */}
            <div className="relative z-10 md:w-1/2 md:pl-8 ${index % 2 === 0 ? 'md:pr-8 md:pl-0' : ''}">
               {/* Dot on timeline */}
              <div className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background
                              left-[-22px] md:left-auto 
                              ${index % 2 === 0 ? 'md:right-[-30px]' : 'md:left-[-30px]'}`}>
              </div>
              <ExperienceItem {...exp} />
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
