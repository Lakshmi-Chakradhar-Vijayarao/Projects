// src/components/ai/ContentReader.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Square, Loader2, XCircle } from 'lucide-react'; // Play/Stop icons
import { cn } from '@/lib/utils';

interface SectionToRead {
  id: string; // Corresponds to the HTML ID of the section on the page
  speakableText: string; // The text to be spoken for this section
  // No autoAdvanceTo or autoAdvanceDelay, as it will be sequential
}

// Define the sections and their speakable text
const sectionsToReadData: SectionToRead[] = [
  // This initial welcome will be spoken by the controller, not ContentReader
  { id: "about", speakableText: "About Chakradhar: He is a versatile Software Engineer and Machine Learning practitioner with proven experience delivering scalable, secure, and user-centric applications using Python, React.js, Node.js, and MySQL. He's skilled at optimizing backend performance, implementing secure authentication, and developing AI-powered solutions with measurable outcomes. Strong collaborator with expertise in Agile workflows, continuous learning, and cloud technologies." },
  { id: "skills-section", speakableText: "Regarding Chakradhar's Technical Skills: For Programming Languages, he uses Python, Java, JavaScript, C++, C, and C Sharp. Key Frameworks & Libraries include React.js, Node.js, Express.js, Django, Scikit-learn, YOLO, OpenCV, NumPy, and Pandas. For Data & Machine Learning, he works with PySpark, Hadoop, and Databricks, applying algorithms like Decision Trees, Random Forest, KNN, and YOLO, along with model evaluation and data preprocessing. In Cloud & DevOps, he's familiar with AWS services like EC2, S3, Lambda, GitHub Actions, CI/CD fundamentals, Docker, REST API integration, and Linux. His Database expertise includes MySQL, PostgreSQL, and SQL. Finally, his common Tools & Practices involve Git, VS Code, Eclipse, Jupyter Notebooks, Agile development, API design, and cross-functional collaboration." },
  { id: "experience", speakableText: "About Chakradhar's Experience: At NSIC Technical Services Centre in Chennai, as an Internship Project Trainee from April to June 2023, he developed a full-stack e-commerce platform, enhanced login security with JWT and OAuth2, and conducted Android full-stack training. At Zoho Corporation in Chennai, as a Summer Internship Project Associate from March to April 2022, he optimized backend API and SQL performance for a video conferencing app, integrated WebRTC for over 1,000 real-time users, and participated in Agile sprints." },
  { id: "projects", speakableText: "Regarding Chakradhar's Projects: He has worked on AI-Powered Smart Detection of Crops and Weeds, a Search Engine for Movie Summaries, a Facial Recognition Attendance System, Mushroom Classification with Scikit-Learn, and Custom Process Scheduler Development." },
  { id: "education-section", speakableText: "For his Education: Chakradhar is pursuing a Master of Science in Computer Science at The University of Texas at Dallas, expecting to graduate in May 2025 with a GPA of 3.607. He holds a Bachelor of Engineering in Electronics and Communication from R.M.K Engineering College, India, graduating in March 2023 with a GPA of 9.04." },
  { id: "certifications-section", speakableText: "Chakradhar's Certifications include: IBM DevOps and Software Engineering Professional Certificate, Microsoft Full-Stack Developer Professional Certificate, Meta Back-End Developer Professional Certificate, and AWS Certified Cloud Practitioner from AWS Academy." },
  { id: "publication-section", speakableText: "His Publication is on Text Detection Based on Deep Learning, where he built a handwriting recognition model achieving 98.6% training precision, presented at an IEEE Conference." },
  { id: "contact", speakableText: "This concludes the overview of Chakradhar's portfolio. You can find ways to get in touch in the contact section." }
];


const ContentReader: React.FC = () => {
  const [isReading, setIsReading] = useState(false);
  const [isLoadingSpeech, setIsLoadingSpeech] = useState(false);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sectionQueueRef = useRef<SectionToRead[]>([]);
  const currentSectionIndexRef = useRef(0); // To track which section to resume from

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      // Ensure voices are loaded (helps with some browsers)
      const populateVoiceList = () => {
        if(synthRef.current && synthRef.current.getVoices().length > 0) {
          console.log("ContentReader: Voices loaded.");
          if(synthRef.current) synthRef.current.onvoiceschanged = null; // remove listener once voices are loaded
        }
      };
      populateVoiceList();
      if (synthRef.current && synthRef.current.onvoiceschanged !== populateVoiceList) {
        synthRef.current.onvoiceschanged = populateVoiceList;
      }
    } else {
      console.warn("ContentReader: Speech synthesis not supported by this browser.");
    }

    return () => {
      setIsMounted(false);
      if (synthRef.current) {
        console.log("ContentReader: Unmounting, cancelling speech.");
        if (utteranceRef.current) {
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
        }
        synthRef.current.cancel();
      }
    };
  }, []);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`ContentReader: Scrolling to section: ${id}`);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`ContentReader: Element with id "${id}" not found for scrolling.`);
    }
  }, []);

  const speakText = useCallback((textToSpeak: string, onEndCallback?: () => void) => {
    if (!isMounted || !synthRef.current || !textToSpeak) {
      console.warn("ContentReader: SpeakText conditions not met.", { isMounted, synthRefReady: !!synthRef.current, textToSpeak });
      if (onEndCallback) onEndCallback();
      return;
    }
    console.log(`ContentReader: Attempting to speak: "${textToSpeak.substring(0,30)}..."`);
    
    // Cancel any ongoing or pending speech *before* creating a new utterance
    if (synthRef.current.speaking || synthRef.current.pending) {
        console.log("ContentReader: Cancelling existing speech before new utterance.");
        if(utteranceRef.current) {
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
        }
        synthRef.current.cancel(); 
    }
    
    // Allow a brief moment for cancel to process
    setTimeout(() => {
        if (!isMounted || !synthRef.current) return; // Re-check after timeout

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = utterance;

        utterance.onstart = () => {
          console.log(`ContentReader: Speech started for: "${textToSpeak.substring(0,30)}..."`);
          setIsLoadingSpeech(false);
        };
        
        utterance.onend = () => {
          console.log(`ContentReader: Speech ended for: "${textToSpeak.substring(0,30)}..."`);
          if (utteranceRef.current === utterance) { // Ensure it's the correct utterance
            utteranceRef.current = null;
            if (onEndCallback) onEndCallback();
          }
        };

        utterance.onerror = (event) => {
          console.error("ContentReader: SpeechSynthesisUtterance.onerror", event.error, `For text: "${textToSpeak.substring(0,30)}..."`);
          if (utteranceRef.current === utterance) {
            utteranceRef.current = null;
          }
          setIsReading(false);
          setIsLoadingSpeech(false);
          if (onEndCallback) onEndCallback(); // still call to allow cleanup or next steps
        };

        synthRef.current.speak(utterance);
    }, 50); // Small delay to ensure cancel is processed.

  }, [isMounted]);

  const processSpeechQueue = useCallback(() => {
    if (!isReading || !isMounted) {
      console.log("ContentReader: processSpeechQueue - not reading or not mounted, stopping.");
      setIsReading(false); // Ensure state is consistent
      return;
    }

    if (sectionQueueRef.current.length > 0) {
      const nextSection = sectionQueueRef.current.shift(); // Get and remove next section
      if (nextSection) {
        currentSectionIndexRef.current = sectionsToReadData.findIndex(s => s.id === nextSection.id);
        console.log(`ContentReader: Processing section from queue: ${nextSection.id}`);
        smoothScrollTo(nextSection.id);
        speakText(nextSection.speakableText, processSpeechQueue); // Recursively call on end
      } else { // Should not happen if length > 0, but as a safeguard
        console.log("ContentReader: Queue had items, but shift returned undefined. Stopping.");
        setIsReading(false);
      }
    } else {
      console.log("ContentReader: Speech queue empty. Tour finished.");
      speakText("This concludes the overview of Chakradhar's portfolio.", () => {
        setIsReading(false);
        setHasSpokenWelcome(false); // Allow welcome to be spoken again if tour is restarted
        currentSectionIndexRef.current = 0; // Reset for next time
      });
    }
  }, [isReading, isMounted, smoothScrollTo, speakText]);


  const handleToggleRead = useCallback(() => {
    if (!isMounted || !synthRef.current) {
      console.warn("ContentReader: Cannot toggle read, component not ready.");
      return;
    }

    if (isReading) {
      console.log("ContentReader: Stopping speech.");
      setIsReading(false);
      setIsLoadingSpeech(false);
      sectionQueueRef.current = []; // Clear the queue
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      synthRef.current.cancel();
      utteranceRef.current = null;
    } else {
      console.log("ContentReader: Starting speech sequence.");
      setIsLoadingSpeech(true);
      const welcomeText = "Welcome. I will now briefly guide you through Chakradhar's portfolio sections.";
      
      const startMainTour = () => {
        setHasSpokenWelcome(true);
        // Start from currentSectionIndexRef or 0 if never started/reset
        const startIndex = currentSectionIndexRef.current < sectionsToReadData.length ? currentSectionIndexRef.current : 0;
        sectionQueueRef.current = [...sectionsToReadData.slice(startIndex)];
        setIsReading(true); // This will trigger the useEffect below to start processSpeechQueue
         // Directly call processSpeechQueue after setting isReading to true
        requestAnimationFrame(() => processSpeechQueue());
      };

      if (!hasSpokenWelcome) {
        speakText(welcomeText, startMainTour);
      } else {
        startMainTour();
      }
    }
  }, [isReading, isMounted, hasSpokenWelcome, speakText, processSpeechQueue]);


  if (!isMounted) {
    return null; // Don't render anything until mounted and synth is potentially available
  }

  return (
    <Button
      onClick={handleToggleRead}
      variant="outline"
      size="icon"
      className={cn(
        "fixed bottom-20 right-6 sm:bottom-20 sm:right-8 z-[9999]", // Positioned above chatbot bubble
        "rounded-full w-14 h-14 sm:w-16 sm:h-16",
        "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg",
        isLoadingSpeech && "cursor-wait"
      )}
      aria-label={isReading ? "Stop Reading" : "Read Page Content"}
      disabled={isLoadingSpeech}
    >
      {isLoadingSpeech ? <Loader2 className="h-6 w-6 animate-spin" /> : (isReading ? <Square className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />)}
    </Button>
  );
};

export default ContentReader;
