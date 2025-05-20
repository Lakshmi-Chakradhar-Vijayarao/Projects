
import ExperienceItem from '@/components/experience-item';
import { SectionWrapper } from '@/components/ui/section-wrapper';

const experienceData = [
  {
    title: 'Internship Project Trainee',
    company: 'NSIC Technical Services Centre',
    location: 'Chennai, India',
    duration: 'Apr 2023 – Jun 2023',
    descriptionPoints: [
      'Constructed a responsive e-commerce platform using React.js, Node.js, and MySQL, increasing user engagement by 20%.',
      'Implemented OAuth2 and JWT-based authentication, reducing session errors by 25% and enhancing login reliability.',
      'Facilitated Android full-stack training for 30+ students, achieving a 95% pass rate and boosting job placement outcomes by 40%.',
    ],
    companyLogoSrc: "/logos/nsic.png",
    companyLogoAlt: "NSIC Technical Services Centre Logo",
    dataAiHint: "nsic",
  },
  {
    title: 'Summer Internship Project Associate',
    company: 'Zoho Corporation Private Limited',
    location: 'Chennai, India',
    duration: 'Mar 2022 – Apr 2022',
    descriptionPoints: [
      'Streamlined backend performance by refining API calls and optimizing SQL queries in a video conferencing application.',
      'Integrated WebRTC for low-latency communication, enhancing real-time interaction for 1,000+ concurrent users.',
      'Partnered with QA and product teams in Agile sprints to release reliable, scalable features.',
    ],
    companyLogoSrc: "/logos/zoho.png",
    companyLogoAlt: "Zoho Corporation Logo",
    dataAiHint: "zoho",
  },
];

export default function Experience() {
  return (
    <SectionWrapper id="experience" title="My Experience">
      <div className="relative space-y-12">
        {/* Vertical line for timeline effect */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-border/50 rounded-full md:left-1/2 md:-translate-x-1/2"></div>
        
        {experienceData.map((exp, index) => (
          <div key={exp.company + exp.title} className={`relative flex items-start ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
            {/* Spacer for desktop layout */}
            <div className="hidden md:flex md:w-1/2"></div>
            {/* Timeline dot */}
            <div className={`absolute top-8 transform -translate-y-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-md
                            ${index % 2 === 0 ? 'md:right-[-8px] left-[-7px] md:left-auto' : 'md:left-[-8px] left-[-7px]'}`}>
            </div>
            {/* Experience Card */}
            <div className={`relative z-10 w-full md:w-[calc(50%-1rem)] ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
              <ExperienceItem {...exp} />
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
