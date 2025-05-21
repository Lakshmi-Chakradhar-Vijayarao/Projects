// src/components/ai/ContentReader.tsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';

interface SectionToRead {
  id: string;
  speakableText: string;
  uiMessage?: string | React.ReactNode;
  autoAdvanceTo?: string;
  autoAdvanceDelay?: number;
  onAction?: 'triggerProjectsInteractive' | 'triggerTourComplete';
}

// This data defines the tour content and flow for ContentReader
// NOTE: This is the SCRIPT the AI assistant should follow for voice tour.
const sectionsToReadData: SectionToRead[] = [
  { 
    id: 'summary_intro', // Corresponds to About Me section with id="about"
    speakableText: "Chakradhar is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.",
    autoAdvanceTo: 'skills_intro', 
    autoAdvanceDelay: 7000 // Allow time for speech
  },
  { 
    id: 'skills_intro', 
    speakableText: "Here’s what Chakradhar works with regularly: For Languages: Python, Java, JavaScript, C++, C, and C#. For Web and ML Libraries: React.js, Node.js, Express.js, Django, Scikit-learn, YOLO, and OpenCV. For Data and Cloud: PySpark, Hadoop, Databricks, AWS, and Docker. Databases include MySQL, PostgreSQL, and Oracle. His tools include Git, Linux, VS Code, and REST APIs. And for practices: Agile, CI/CD, and API Design.",
    autoAdvanceTo: 'experience_intro', 
    autoAdvanceDelay: 12000
  },
  { 
    id: 'experience_intro', 
    speakableText: "Regarding his experience: At NSIC Technical Services Centre in Chennai, as an Intern from April to June 2023, he built an e-commerce platform using React.js, Node.js, and MySQL, secured login with OAuth2 and JWT, and conducted Android full-stack training. At Zoho Corporation in Chennai, as a Summer Intern, he refined backend APIs for a video app, integrated WebRTC for over 1,000 users, and collaborated in Agile sprints.",
    autoAdvanceTo: 'projects_list_intro', 
    autoAdvanceDelay: 15000 
  },
  { 
    id: 'projects_list_intro', // Controller will handle speaking titles and button display
    speakableText: "Chakradhar has led and contributed to impactful projects. The main chat window will now show options to explore them.",
    onAction: 'triggerProjectsInteractive', // Controller will handle this
    // No autoAdvanceTo here, as it waits for user interaction via controller
  },
  { 
    id: 'education_intro', 
    speakableText: "About his education: Chakradhar is pursuing a Master of Science in Computer Science at The University of Texas at Dallas, expecting to graduate in May 2025 with a GPA of 3.607. He holds a Bachelor of Engineering in Electronics and Communication from R.M.K Engineering College, India, graduating in March 2023 with a GPA of 9.04.",
    autoAdvanceTo: 'certifications_intro', 
    autoAdvanceDelay: 10000
  },
  { 
    id: 'certifications_intro', 
    speakableText: "Chakradhar holds certifications from IBM for DevOps & Software Engineering, Microsoft as a Full-Stack Developer, Meta as a Back-End Developer, and AWS as a Certified Cloud Practitioner.",
    autoAdvanceTo: 'publication_intro', 
    autoAdvanceDelay: 8000
  },
  { 
    id: 'publication_intro', 
    speakableText: "His publication is on Text Detection Using Deep Learning. He built a handwriting recognition model using MNIST-style data, reaching 98.6% training accuracy, presented at an IEEE Conference.",
    autoAdvanceTo: 'additional_info_intro', 
    autoAdvanceDelay: 7000
  },
  {
    id: 'additional_info_intro',
    speakableText: "Additional valuable skills include proficiency with Git, Linux, REST APIs, strong OOP and multithreading in Java, and experience in model evaluation, preprocessing, and computer vision with Scikit-learn and YOLO.",
    onAction: 'triggerTourComplete', // This will be the last step spoken by ContentReader
    autoAdvanceDelay: 8000
  }
];

export const ContentReaderSectionsDataForDetails = sectionsToReadData.find(s => s.id === 'projects_list_intro')?.projectDetails || []; // Placeholder for project details if needed by controller

interface ContentReaderProps {
  startTourSignal: boolean;
  stopTourSignal: boolean;
  currentGlobalStepId: string | null;
  onTourComplete: () => void;
  onProjectsStepReached: () => void; 
  addMessageToChat: (sender: 'ai' | 'user', textNode: React.ReactNode, speakableText?: string) => void;
  speakTextProp: (text: string, onEnd?: () => void, isChainedCall?: boolean) => void;
}

const ContentReader: React.FC<ContentReaderProps> = ({
  startTourSignal,
  stopTourSignal,
  currentGlobalStepId,
  onTourComplete,
  onProjectsStepReached,
  addMessageToChat,
  speakTextProp
}) => {
  const [isReading, setIsReading] = useState(false);
  const currentSectionIndexRef = useRef(0); 
  const isMountedRef = useRef(false);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReadingRef = useRef(isReading); 

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      console.log("ContentReader: Unmounting. Stopping speech and clearing timeouts.");
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
      // Ensure speech is cancelled if the component unmounts while reading
      if (speakTextProp && typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [speakTextProp]);

  useEffect(() => {
    isReadingRef.current = isReading;
  }, [isReading]);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    const targetId = id === 'summary_intro' ? 'about' : id; // Map summary_intro to about section
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      console.log(`ContentReader: Scrolling to ${targetId}`);
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`ContentReader: Element with id "${targetId}" not found for scrolling.`);
    }
  }, []);
  
  const handleStopReading = useCallback(() => {
    console.log("ContentReader: handleStopReading called.");
    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }
    setIsReading(false); 
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel(); // Stop any browser speech
    }
  }, [setIsReading]);

  const processSpeechQueue = useCallback(() => {
    if (!isMountedRef.current || !isReadingRef.current) {
      if(isReadingRef.current) handleStopReading();
      return;
    }

    const currentGlobalIndex = currentSectionIndexRef.current;
    if (currentGlobalIndex >= sectionsToReadData.length) {
      onTourComplete();
      handleStopReading();
      return;
    }

    const section = sectionsToReadData[currentGlobalIndex];
    console.log(`ContentReader: Processing section: ${section.id} (Index: ${currentGlobalIndex})`);

    smoothScrollTo(section.id);
    
    const textToDisplay = section.uiMessage || section.speakableText;
    addMessageToChat('ai', <p>{textToDisplay}</p>, section.speakableText);

    speakTextProp(section.speakableText, () => { // onEnd callback from speakTextProp
      if (!isMountedRef.current || !isReadingRef.current) return;

      if (section.onAction === 'triggerProjectsInteractive') {
        console.log("ContentReader: Reached projects interactive step, calling controller.");
        onProjectsStepReached(); // Controller opens chat for project buttons
        handleStopReading(); // Pause ContentReader here
      } else if (section.onAction === 'triggerTourComplete') {
        console.log("ContentReader: Reached end of tour, calling onTourComplete.");
        onTourComplete();
        handleStopReading();
      } else if (section.autoAdvanceTo) {
        const nextSectionIndex = sectionsToReadData.findIndex(s => s.id === section.autoAdvanceTo);
        if (nextSectionIndex !== -1) {
          if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
          tourTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && isReadingRef.current) {
              currentSectionIndexRef.current = nextSectionIndex;
              processSpeechQueue();
            }
          }, section.autoAdvanceDelay || 100);
        } else {
          console.warn(`ContentReader: autoAdvanceTo ID "${section.autoAdvanceTo}" not found. Ending tour.`);
          onTourComplete();
          handleStopReading();
        }
      } else { 
         // If no autoAdvanceTo and no onAction, it's effectively the end for ContentReader unless controller re-signals
        console.log("ContentReader: Section has no autoAdvanceTo or onAction, stopping. Controller may resume for next phase.");
        onTourComplete(); // Or perhaps signal controller differently
        handleStopReading();
      }
    }, true); 

  }, [smoothScrollTo, speakTextProp, addMessageToChat, onTourComplete, onProjectsStepReached, handleStopReading]);

  const startReadingSequence = useCallback((startIndex: number) => {
    if (!isMountedRef.current) return;
    console.log(`ContentReader: STARTING/RESUMING sequence from index: ${startIndex}, sectionId: ${sectionsToReadData[startIndex]?.id}`);
    
    handleStopReading(); 

    currentSectionIndexRef.current = startIndex;
    setIsReading(true); 
  }, [handleStopReading, setIsReading]);

  useEffect(() => {
    if (startTourSignal && !isReadingRef.current && isMountedRef.current) {
      console.log("ContentReader: startTourSignal is true. currentGlobalStepId:", currentGlobalStepId);
      const foundIndex = sectionsToReadData.findIndex(s => s.id === (currentGlobalStepId || sectionsToReadData[0].id));
      const startIndex = foundIndex !== -1 ? foundIndex : 0;
      startReadingSequence(startIndex);
    } else if (stopTourSignal && isReadingRef.current && isMountedRef.current) {
      console.log("ContentReader: stopTourSignal is true, stopping reading.");
      handleStopReading();
    }
  }, [startTourSignal, stopTourSignal, currentGlobalStepId, startReadingSequence, handleStopReading]);
  
  useEffect(() => {
    if (isReading && isMountedRef.current && currentSectionIndexRef.current < sectionsToReadData.length) {
        console.log(`ContentReader: isReading is true. Calling processSpeechQueue for index: ${currentSectionIndexRef.current}`);
        processSpeechQueue();
    } else if (!isReading && isMountedRef.current) {
        // Stop actions are handled by handleStopReading or stopTourSignal effect
    }
  }, [isReading, processSpeechQueue]); // currentSectionIndexRef.current change handled via startReadingSequence

  return null; 
};

export default ContentReader;
