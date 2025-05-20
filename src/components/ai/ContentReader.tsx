
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Define the shape of a section that can be read
interface SectionToRead {
  id: string; // Corresponds to the HTML ID of the section on the page
  speakableText: string; // The text to be spoken for this section
  isSpecial?: boolean; // True if this section has custom handling (e.g., projects)
  onAction?: 'triggerProjectsInteractive' | 'triggerTourComplete'; // Action to take after speaking
  autoAdvanceTo?: string; // ID of the next section to auto-advance to
  autoAdvanceDelay?: number; // Delay in ms before auto-advancing
}

// Define sections based on the resume script and page IDs
const sectionsToReadData: SectionToRead[] = [
  {
    id: 'about', // Should match the ID of your About Me section
    speakableText: "About Chakradhar: He is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.",
    autoAdvanceTo: 'skills-section',
    autoAdvanceDelay: 100
  },
  {
    id: 'skills-section',
    speakableText: "His technical skills include: Languages: Python, Java, JavaScript, C++, C, C#. Web and ML Libraries: React.js, Node.js, Express.js, Django, Scikit-learn, YOLO, OpenCV. Data and Cloud: PySpark, Hadoop, Databricks, AWS, Docker. Databases: MySQL, PostgreSQL, Oracle. Tools: Git, Linux, VS Code, REST APIs. And Practices like Agile, CI/CD, and API Design.",
    autoAdvanceTo: 'experience',
    autoAdvanceDelay: 100
  },
  {
    id: 'experience',
    speakableText: "Regarding his experience: At NSIC Technical Services Centre in Chennai, as an Intern from April to June 2023, Chakradhar built an e-commerce platform, secured login with OAuth2 and JWT, and conducted Android full-stack training. At Zoho Corporation, also in Chennai, as a Summer Internship Project Associate from March to April 2022, he refined backend APIs for a video app, integrated WebRTC for over a thousand real-time users, and collaborated in Agile sprints.",
    autoAdvanceTo: 'projects_intro', // This will be the intro message before showing project buttons
    autoAdvanceDelay: 100
  },
  {
    id: 'projects_intro', // Special step to trigger project interaction in the controller
    speakableText: "Chakradhar has led and contributed to impactful projects. Here are the titles.",
    isSpecial: true,
    onAction: 'triggerProjectsInteractive',
    // No autoAdvanceTo from here, controller will resume if user clicks "Next Section" from project interaction
  },
  {
    id: 'education-section',
    speakableText: "His education includes: A Master of Science in Computer Science from The University of Texas at Dallas, with a GPA of 3.607, and a Bachelor of Engineering in Electronics and Communication from R.M.K Engineering College, India, with a GPA of 9.04.",
    autoAdvanceTo: 'certifications-section',
    autoAdvanceDelay: 100
  },
  {
    id: 'certifications-section',
    speakableText: "Chakradhar holds certifications from leading organizations: IBM DevOps and Software Engineering, Microsoft Full-Stack Developer, Meta Back-End Developer, and AWS Certified Cloud Practitioner.",
    autoAdvanceTo: 'publication-section',
    autoAdvanceDelay: 100
  },
  {
    id: 'publication-section',
    speakableText: "His publication is 'Text Detection Using Deep Learning', where he built a handwriting recognition model achieving 98.6% training accuracy, presented at an IEEE Conference.",
    autoAdvanceTo: 'additional_info',
    autoAdvanceDelay: 100
  },
  {
    id: 'additional_info',
    speakableText: "Additionally, Chakradhar is proficient with Git, Linux, REST APIs, has a strong OOP and multithreading background in Java, and is experienced in model evaluation and computer vision with Scikit-learn and YOLO.",
    isSpecial: true,
    onAction: 'triggerTourComplete', // This will call onTourComplete prop
    autoAdvanceDelay: 100 // Short delay before triggering complete
  },
];


interface ContentReaderProps {
  startTour: boolean;
  stopTourSignal: boolean; // New prop to signal stopping the tour
  onTourComplete: () => void;
  onProjectsStepReached: () => void; // Callback for when the projects intro is done
  initialSectionIndex?: number; // To start or resume tour from a specific section
  currentGlobalStepId?: string; // For syncing with the controller's idea of the current step
}

const ContentReader: React.FC<ContentReaderProps> = ({
  startTour,
  stopTourSignal,
  onTourComplete,
  onProjectsStepReached,
  initialSectionIndex = 0,
  currentGlobalStepId // This prop helps sync ContentReader with the controller's current step
}) => {
  const [isReading, setIsReading] = useState(false);
  const isReadingRef = useRef(isReading); // To get the latest isReading value in callbacks

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sectionQueueRef = useRef<SectionToRead[]>([]);
  const currentSectionIndexRef = useRef(initialSectionIndex);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false); // Declare isMountedRef

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      console.log("ContentReader: Speech synthesis initialized.");
    } else {
      console.warn("ContentReader: Speech synthesis not supported.");
    }

    return () => {
      isMountedRef.current = false;
      console.log("ContentReader: Unmounting. Cancelling speech and timeout.");
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      if (synthRef.current?.speaking) synthRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    isReadingRef.current = isReading;
  }, [isReading]);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`ContentReader: Scrolling to section: #${id}`);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`ContentReader: Element with id #${id} not found for scrolling.`);
    }
  }, []);

  const handleStopReading = useCallback(() => {
    console.log("ContentReader: handleStopReading called.");
    setIsReading(false); // This will trigger the useEffect to stop synth
  }, [setIsReading]);

  const speakText = useCallback((textToSpeak: string, onEndCallback?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !textToSpeak) {
      console.warn("ContentReader: SpeakText conditions not met.", {isMounted: isMountedRef.current, synth: !!synthRef.current, text: !!textToSpeak});
      if(onEndCallback) onEndCallback();
      return;
    }
    if (!isReadingRef.current) {
      console.log("ContentReader: speakText called, but isReadingRef is false. Aborting speech.");
      if(onEndCallback) onEndCallback();
      return;
    }

    console.log(`ContentReader: Attempting to speak: "${textToSpeak.substring(0, 50)}..."`);
    
    if (utteranceRef.current) { // Clean up previous utterance if any
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
    }
    // Do not call synthRef.current.cancel() here to allow chaining

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    utterance.onend = () => {
      console.log(`ContentReader: Speech ended for: "${textToSpeak.substring(0, 50)}..."`);
      if (utteranceRef.current === utterance && isReadingRef.current) {
        utterance.onend = null; 
        utterance.onerror = null;
        utteranceRef.current = null;
        if (onEndCallback) onEndCallback();
      } else {
        console.log("ContentReader: onend called for a stale/cancelled utterance or reading stopped.");
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error;
      }
      console.error('ContentReader: SpeechSynthesisUtterance.onerror for text:', `"${textToSpeak.substring(0,50)}..."`, 'Error details:', errorDetails, 'Full event object:', event);
      if (utteranceRef.current === utterance) { // Check if it's still the current utterance
          utterance.onend = null;
          utterance.onerror = null;
          utteranceRef.current = null;
      }
      handleStopReading(); // Stop the tour on any speech error
    };
    
    synthRef.current.speak(utterance);
  }, [handleStopReading]); // Removed synthRef from deps as it's stable after mount


  const processSpeechQueue = useCallback(() => {
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current); // Clear any pending auto-advance

    if (!isReadingRef.current || sectionQueueRef.current.length === 0) {
      console.log("ContentReader: Queue empty or not actively reading.", {isReading: isReadingRef.current, queueLength: sectionQueueRef.current.length});
      if (isReadingRef.current && sectionQueueRef.current.length === 0) { // Tour finished naturally
        console.log("ContentReader: Queue empty, tour should be complete.");
        onTourComplete(); 
        handleStopReading(); // Ensure reading state is reset
      }
      return;
    }

    const section = sectionQueueRef.current.shift(); // Get the current section
    if (!section) {
      console.log("ContentReader: No section (undefined) found in queue, stopping.");
      handleStopReading();
      onTourComplete();
      return;
    }
    
    currentSectionIndexRef.current = sectionsToReadData.findIndex(s => s.id === section.id);
    console.log(`ContentReader: Processing section: ${section.id} (Global Index: ${currentSectionIndexRef.current})`);

    if (!section.isSpecial) smoothScrollTo(section.id);

    speakText(section.speakableText, () => {
      if (!isReadingRef.current) return; // Stop if reading was cancelled during speech

      if (section.onAction === 'triggerProjectsInteractive') {
        console.log("ContentReader: Reached projects interactive step. Calling onProjectsStepReached and pausing.");
        onProjectsStepReached();
        setIsReading(false); // Pause ContentReader; controller will resume if needed by setting startTour=true
        return;
      } else if (section.onAction === 'triggerTourComplete') {
        console.log("ContentReader: Reached end of tour action. Calling onTourComplete.");
        onTourComplete();
        setIsReading(false); // Stop reading
        return;
      }

      if (section.autoAdvanceTo) {
        const nextSectionId = section.autoAdvanceTo;
        const nextSectionIndex = sectionsToReadData.findIndex(s => s.id === nextSectionId);
        if (nextSectionIndex !== -1) {
          console.log(`ContentReader: Auto-advancing to ${nextSectionId} after ${section.autoAdvanceDelay || 100}ms`);
          tourTimeoutRef.current = setTimeout(() => {
            if (!isReadingRef.current) return; // Check again before advancing
            // The queue has already been shifted, so processSpeechQueue will pick up from where it left off
            // or start fresh if the queue was repopulated by startReadingSequence
            processSpeechQueue(); 
          }, section.autoAdvanceDelay || 100);
        } else {
          console.warn(`ContentReader: Auto-advance target "${nextSectionId}" not found. Stopping.`);
          handleStopReading();
        }
      } else if (sectionQueueRef.current.length > 0) { // No auto-advance, but queue has more items
         console.log("ContentReader: No auto-advance, but queue has items. Processing next for section:", section.id);
         processSpeechQueue(); // Directly call to process next item from shifted queue
      } else { // No autoAdvanceTo and queue is now empty
        console.log("ContentReader: End of queue and no auto-advance. This case usually handled by onAction:triggerTourComplete.");
        onTourComplete(); // Fallback if not caught by onAction
        handleStopReading();
      }
    });
  }, [speakText, smoothScrollTo, onProjectsStepReached, onTourComplete, handleStopReading, setIsReading]);


  const startReadingSequence = useCallback((startIndex: number) => {
    console.log(`ContentReader: startReadingSequence called, startIndex: ${startIndex}`);
    if (!isMountedRef.current || !synthRef.current) {
      console.warn("ContentReader: Cannot start reading, component not mounted or synth not ready.");
      setIsReading(false);
      return;
    }

    // Clear any ongoing speech or timeouts
    if (synthRef.current.speaking || synthRef.current.pending) {
      console.log("ContentReader (startReadingSequence): Cancelling existing speech.");
      if (utteranceRef.current) {
        utteranceRef.current.onend = null; // Detach handler before cancelling
        utteranceRef.current.onerror = null;
      }
      synthRef.current.cancel();
    }
    utteranceRef.current = null; // Clear the ref

    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }
    
    currentSectionIndexRef.current = startIndex;
    sectionQueueRef.current = sectionsToReadData.slice(startIndex); // Rebuild queue from the start/resume index
    
    if (sectionQueueRef.current.length > 0) {
      console.log("ContentReader: Queue populated, setting isReading to true. Length:", sectionQueueRef.current.length);
      setIsReading(true); // This will trigger the useEffect to call processSpeechQueue
    } else {
      console.log("ContentReader: Queue is empty at startReadingSequence, not starting. Calling onTourComplete.");
      setIsReading(false);
      onTourComplete(); 
    }
  }, [setIsReading, onTourComplete]); // Removed sectionsToReadData as it's module-level const
  
  // Effect to start/stop queue processing based on isReading state
  useEffect(() => {
    if (isReading) {
      if (isMountedRef.current && synthRef.current && sectionQueueRef.current.length > 0) {
        console.log("ContentReader: isReading became true, calling processSpeechQueue. Queue length:", sectionQueueRef.current.length);
        processSpeechQueue(); // Start processing if not already (e.g., after setIsReading(true))
      } else if (isMountedRef.current && synthRef.current && sectionQueueRef.current.length === 0) {
         console.log("ContentReader: isReading is true, but queue is empty. Assuming tour is complete.");
         onTourComplete();
         handleStopReading(); // Stop reading state
      }
    } else { // isReading is false
      console.log("ContentReader: isReading became false. Ensuring synth is cancelled and queue/timeout cleared.");
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
      if (synthRef.current?.speaking || synthRef.current?.pending) {
        if (utteranceRef.current) { // Detach handlers before cancelling
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
        }
        synthRef.current.cancel();
      }
      utteranceRef.current = null;
      sectionQueueRef.current = []; // Clear the queue
    }
  }, [isReading, processSpeechQueue, onTourComplete, handleStopReading]);


  // Effect to react to startTourSignal from parent
  useEffect(() => {
    // Sync currentSectionIndexRef with global step ID if provided and changed
    if (currentGlobalStepId) {
        const globalStepIdx = sectionsToReadData.findIndex(s => s.id === currentGlobalStepId);
        if (globalStepIdx !== -1 && currentSectionIndexRef.current !== globalStepIdx) {
            console.log(`ContentReader: Global step ID ${currentGlobalStepId} implies starting/resuming from index ${globalStepIdx}`);
            currentSectionIndexRef.current = globalStepIdx; // Update internal tracking
        }
    }
    
    if (startTour && !isReadingRef.current && isMountedRef.current && synthRef.current) {
      console.log("ContentReader: startTourSignal is true. Calling startReadingSequence with index:", currentSectionIndexRef.current);
      startReadingSequence(currentSectionIndexRef.current);
    }
  }, [startTour, synthRef, startReadingSequence, currentGlobalStepId]); // Added currentGlobalStepId
  
  // Effect to react to stopTourSignal from parent
  useEffect(() => {
    if (stopTourSignal && isReadingRef.current && isMountedRef.current) {
      console.log("ContentReader: stopTourSignal received. Calling handleStopReading.");
      handleStopReading();
    }
  }, [stopTourSignal, handleStopReading]);

  // Expose project details (static data) for the controller
  ContentReader.sectionsToReadData_FOR_DETAILS_ONLY = sectionsToReadData;

  return null; // This component does not render any UI itself
};

// Static property for controller access
ContentReader.sectionsToReadData_FOR_DETAILS_ONLY = sectionsToReadData;


export default ContentReader;

