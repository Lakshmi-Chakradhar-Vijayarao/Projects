// src/components/ai/ContentReader.tsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { AvatarAction } from './AnimatedVideoAvatar'; // Assuming AvatarAction is exported from here

interface ProjectDetail { // For project details in chat
  title: string;
  description: string;
}

interface SectionToRead {
  id: string;
  speakableText: string; // What the AI says for this section
  uiMessage?: string | React.ReactNode; // Optional: different text for chat UI if needed
  autoAdvanceTo?: string; // ID of the next section to auto-advance to
  autoAdvanceDelay?: number; // Delay in ms before auto-advancing
  onAction?: 'triggerProjectsInteractive' | 'triggerTourComplete'; // Special actions
  projectDetails?: ProjectDetail[]; // Only for 'projects' section
}

// This data defines the tour content and flow for ContentReader
const sectionsToReadData: SectionToRead[] = [
  { 
    id: 'about', 
    speakableText: "About Chakradhar: He is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.",
    autoAdvanceTo: 'skills-section', 
    autoAdvanceDelay: 100 // Quick advance after speaking
  },
  { 
    id: 'skills-section', 
    speakableText: "Regarding his technical skills: Chakradhar works regularly with Python, Java, JavaScript, React.js, Node.js, Scikit-learn, YOLO, PySpark, AWS, Docker, MySQL, PostgreSQL, Git, and Agile practices.",
    autoAdvanceTo: 'experience', 
    autoAdvanceDelay: 100
  },
  { 
    id: 'experience', 
    speakableText: "Moving to Chakradhar's experience: At NSIC, he built an e-commerce platform and conducted Android training. At Zoho, he optimized backend performance for a video app and integrated WebRTC.",
    autoAdvanceTo: 'projects', 
    autoAdvanceDelay: 100 
  },
  { 
    id: 'projects', 
    speakableText: "Chakradhar has led and contributed to impactful projects. I will now list their titles.", // Controller will speak this, then this component calls onProjectsStepReached
    onAction: 'triggerProjectsInteractive', // Controller will handle individual project title speaking and buttons
    projectDetails: [ // These details are for InteractiveChatbot if user clicks a project
        { title: "AI-Powered Smart Detection of Crops and Weeds", description: "He built a YOLO-based object detection system with 90% accuracy for identifying crops and weeds. This helped reduce herbicide usage by 15%." },
        { title: "Search Engine for Movie Summaries", description: "Using PySpark and Hadoop, he developed a search engine that improves query relevance with TF-IDF and cosine similarity across 100K+ records." },
        { title: "Facial Recognition Attendance System", description: "Designed a face-recognition attendance system using OpenCV, achieving 99% accuracy for 200+ users, with real-time cloud syncing." },
        { title: "Mushroom Classification with Scikit-Learn", description: "Used ensemble models like Decision Tree, Random Forest, and KNN to classify mushrooms with 95% accuracy, even with 20% missing data." },
        { title: "Custom Process Scheduler", description: "Programmed priority and lottery-based schedulers in xv6/Linux kernel, reducing context-switching by 18% and validating fairness with simulations." }
    ]
  },
  { 
    id: 'education-section', 
    speakableText: "About his education: Chakradhar is pursuing a Master of Science in Computer Science at The University of Texas at Dallas and holds a Bachelor's from R.M.K Engineering College.",
    autoAdvanceTo: 'certifications-section', 
    autoAdvanceDelay: 100
  },
  { 
    id: 'certifications-section', 
    speakableText: "He also holds certifications from IBM for DevOps & Software Engineering, Microsoft as a Full-Stack Developer, Meta as a Back-End Developer, and AWS as a Certified Cloud Practitioner.",
    autoAdvanceTo: 'publication-section', 
    autoAdvanceDelay: 100
  },
  { 
    id: 'publication-section', 
    speakableText: "His publication is on Text Detection Using Deep Learning. He built a handwriting recognition model, reaching 98.6% training accuracy, presented at an IEEE Conference.",
    autoAdvanceTo: 'additional_info', 
    autoAdvanceDelay: 100
  },
  {
    id: 'additional_info',
    speakableText: "Additional valuable skills include proficiency with Git, Linux, REST APIs, strong OOP and multithreading in Java, and experience in model evaluation and computer vision with Scikit-learn and YOLO.",
    onAction: 'triggerTourComplete' // This will be the last step spoken by ContentReader
  }
];

// Static export for IntegratedAssistantController to access project details for buttons
// This is a way to share data without prop drilling it back up.
// A context or Zustand store would be cleaner for larger applications.
export const ContentReaderSectionsDataForDetails = sectionsToReadData;


interface ContentReaderProps {
  startTourSignal: boolean;
  stopTourSignal: boolean;
  currentGlobalStepId: string | null; // The ID of the section to start/resume from
  onTourComplete: () => void;
  onProjectsStepReached: () => void; 
  addMessageToChat: (sender: 'ai' | 'user', textNode: React.ReactNode, speakableText?: string) => void;
  // ContentReader will now use the speakTextProp from the controller
  speakTextProp: (text: string, onEnd?: () => void, isChainedCall?: boolean) => void;
  // No longer needs setAvatarActionProp, as speakTextProp will handle it
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
  // currentSectionIndexRef tracks the actual index in sectionsToReadData
  const currentSectionIndexRef = useRef(0); 
  
  const isMountedRef = useRef(false);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReadingRef = useRef(isReading); 

  useEffect(() => {
    isReadingRef.current = isReading;
  }, [isReading]);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`ContentReader: Scrolling to ${id}`);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' }); // 'center' might be better
    } else {
      console.warn(`ContentReader: Element with id "${id}" not found for scrolling.`);
    }
  }, []);
  
  const handleStopReading = useCallback(() => {
    console.log("ContentReader: handleStopReading called.");
    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }
    setIsReading(false); 
    // Note: Actual synth.cancel() and utterance cleanup is now expected to be
    // handled by the speakTextProp if it's a globally managed synth instance,
    // or if speakTextProp itself calls a method that stops the shared synth.
    // If speakTextProp creates new utterances each time, then this is fine.
  }, [setIsReading]);


  const processSpeechQueue = useCallback(() => {
    if (!isMountedRef.current || !isReadingRef.current) {
      console.log("ContentReader: Not reading or not mounted, processSpeechQueue stopping.");
      if (isReadingRef.current) handleStopReading(); // Ensure cleanup if it was supposed to be reading
      return;
    }

    const currentGlobalIndex = currentSectionIndexRef.current;
    if (currentGlobalIndex >= sectionsToReadData.length) {
      console.log("ContentReader: Reached end of sectionsData, calling onTourComplete.");
      onTourComplete();
      handleStopReading();
      return;
    }

    const section = sectionsToReadData[currentGlobalIndex];
    console.log(`ContentReader: Processing section: ${section.id} (Index: ${currentGlobalIndex})`);

    if (section.id !== 'hero') { // Don't scroll for a hero section if it were the first
        smoothScrollTo(section.id);
    }
    
    const textToDisplayInChat = section.uiMessage || section.speakableText;
    addMessageToChat('ai', <p>{textToDisplayInChat}</p>, section.speakableText);

    speakTextProp(section.speakableText, () => { // onEnd callback from speakTextProp
      if (!isMountedRef.current || !isReadingRef.current) return; // Guard against unmounted or stopped state

      if (section.onAction === 'triggerProjectsInteractive') {
        console.log("ContentReader: Reached projects interactive step, calling controller.");
        onProjectsStepReached();
        handleStopReading(); // Pause ContentReader here
      } else if (section.onAction === 'triggerTourComplete') {
        console.log("ContentReader: Reached end of tour, calling onTourComplete.");
        onTourComplete(); // Controller handles UI
        handleStopReading();
      } else if (section.autoAdvanceTo) {
        const nextSectionIndex = sectionsToReadData.findIndex(s => s.id === section.autoAdvanceTo);
        if (nextSectionIndex !== -1) {
          if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
          tourTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && isReadingRef.current) {
              currentSectionIndexRef.current = nextSectionIndex; // Update ref for next iteration
              processSpeechQueue(); // Process the next section
            }
          }, section.autoAdvanceDelay || 100);
        } else {
          console.warn(`ContentReader: autoAdvanceTo ID "${section.autoAdvanceTo}" not found. Ending tour.`);
          onTourComplete();
          handleStopReading();
        }
      } else { 
        console.log("ContentReader: Section has no autoAdvanceTo or onAction, effectively ending ContentReader part.");
        onTourComplete(); // Or perhaps a different state if it's not truly "complete"
        handleStopReading();
      }
    }, true); // isChainedCall = true (assuming speakTextProp handles chaining)

  }, [
      smoothScrollTo, 
      speakTextProp, 
      addMessageToChat,
      onTourComplete, 
      onProjectsStepReached,
      handleStopReading, // Added setIsReading to dependencies through handleStopReading
    ]);

  const startReadingSequence = useCallback((startIndex: number) => {
    if (!isMountedRef.current) return;
    console.log(`ContentReader: STARTING/RESUMING sequence from index: ${startIndex}, sectionId: ${sectionsToReadData[startIndex]?.id}`);
    
    handleStopReading(); // Clear any previous state before starting anew

    currentSectionIndexRef.current = startIndex;
    setIsReading(true); // This will trigger the useEffect below to start processSpeechQueue
    // processSpeechQueue will be called by the useEffect watching isReading
  }, [handleStopReading, setIsReading]);


  // Effect to handle starting/resuming the tour based on props
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (startTourSignal) {
      console.log("ContentReader: startTourSignal is true. currentGlobalStepId:", currentGlobalStepId);
      const foundIndex = sectionsToReadData.findIndex(s => s.id === (currentGlobalStepId || sectionsToReadData[0].id));
      const startIndex = foundIndex !== -1 ? foundIndex : 0;
      
      if (!isReadingRef.current) { // Only start if not already reading
        startReadingSequence(startIndex);
      } else {
        console.log("ContentReader: startTourSignal is true, but already reading. currentGlobalStepId might have changed.");
        // If tour is active and step changes, ContentReader should ideally restart from new step.
        // This might involve stopping current speech and restarting.
        // For now, if already reading, it might just continue its current path.
        // Or, we could force a restart:
        // handleStopReading(); // Stop current
        // startReadingSequence(startIndex); // Restart from new index
        // Let's assume for now that if it's reading and stepId changes, it should restart.
         currentSectionIndexRef.current = startIndex; // Update the internal index
         // If it was already reading, the current processSpeechQueue will complete its utterance,
         // and its onEnd will pick up the new currentSectionIndexRef.current for the next step.
         // A more immediate jump would require cancelling current speech.
      }
    } else if (stopTourSignal && isReadingRef.current) {
      console.log("ContentReader: stopTourSignal is true, stopping reading.");
      handleStopReading();
    }
  }, [startTourSignal, stopTourSignal, currentGlobalStepId, startReadingSequence, handleStopReading]);
  
  // Effect to process queue when isReading state becomes true
  useEffect(() => {
    if (isReading && isMountedRef.current && currentSectionIndexRef.current < sectionsToReadData.length) {
        console.log(`ContentReader: isReading is true or index changed. Calling processSpeechQueue for index: ${currentSectionIndexRef.current}`);
        processSpeechQueue();
    } else if (!isReading && isMountedRef.current) {
        // This case is handled by handleStopReading or the stopTourSignal effect.
    }
  }, [isReading, processSpeechQueue]); // currentSectionIndexRef.current is a ref, not a state, so it won't trigger this.

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      console.log("ContentReader: Unmounting. Stopping speech and clearing timeouts.");
      handleStopReading();
    };
  }, [handleStopReading]);

  return null; // This component is UI-less, controlled by IntegratedAssistantController
};

export default ContentReader;

// Expose sectionsToReadData for the controller to build project buttons
// This is a simple way; a shared context/store would be cleaner for larger apps.
(ContentReader as any).sectionsToReadData_FOR_DETAILS_ONLY = sectionsToReadData;
