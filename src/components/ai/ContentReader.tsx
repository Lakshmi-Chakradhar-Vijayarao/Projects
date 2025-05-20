
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SectionToRead {
  id: string; 
  speakableText: string;
  isSpecial?: boolean; 
  onAction?: 'triggerProjectsInteractive' | 'triggerTourComplete';
  autoAdvanceTo?: string; 
  autoAdvanceDelay?: number;
}

// Project details for quick lookup by the controller (not directly used by ContentReader for speech)
const projectDetailsScript: Record<string, string> = {
    'AI-Powered_Smart_Detection_of_Crops_and_Weeds': "He built a YOLO-based object detection system with 90% accuracy for identifying crops and weeds. This helped reduce herbicide usage by 15%.",
    'Search_Engine_for_Movie_Summaries': "Using PySpark and Hadoop, he developed a search engine that improves query relevance with TF-IDF and cosine similarity across 100K+ records.",
    'Facial_Recognition_Attendance_System': "Designed a face-recognition attendance system using OpenCV, achieving 99% accuracy for 200+ users, with real-time cloud syncing.",
    'Mushroom_Classification_with_Scikit-Learn': "Used ensemble models like Decision Tree, Random Forest, and KNN to classify mushrooms with 95% accuracy, even with 20% missing data.",
    'Custom_Process_Scheduler': "Programmed priority and lottery-based schedulers in xv6/Linux kernel, reducing context-switching by 18% and validating fairness with simulations."
};


// Define sections based on the resume script and page IDs
const sectionsToReadData: SectionToRead[] = [
  { 
    id: 'about', 
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
    autoAdvanceTo: 'projects_intro', 
    autoAdvanceDelay: 100
  },
  {
    id: 'projects_intro', 
    speakableText: "Chakradhar has led and contributed to impactful projects. Here are the titles.", // Controller will add "...You can ask me to elaborate..."
    isSpecial: true, 
    onAction: 'triggerProjectsInteractive', 
    // No autoAdvanceTo, controller handles next step after project interaction
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
    onAction: 'triggerTourComplete',
    autoAdvanceDelay: 100 // Short delay before triggering complete
  },
];


interface ContentReaderProps {
  startTour: boolean;
  stopTourSignal: boolean;
  onTourComplete: () => void;
  onProjectsStepReached: () => void;
  initialSectionIndex?: number; 
  currentGlobalStepId?: string; 
}

const ContentReader: React.FC<ContentReaderProps> = ({
  startTour,
  stopTourSignal,
  onTourComplete,
  onProjectsStepReached,
  initialSectionIndex = 0,
  currentGlobalStepId 
}) => {
  const [isReading, setIsReading] = useState(false);
  const isReadingRef = useRef(isReading); 

  const [isMounted, setIsMounted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sectionQueueRef = useRef<SectionToRead[]>([]);
  const currentSectionGlobalIndexRef = useRef(initialSectionIndex); 
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (synthRef.current?.speaking) synthRef.current.cancel();
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
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
        if(onEndCallback) onEndCallback(); // ensure flow continues if possible
        return;
    }
    if (!isReadingRef.current) { // Double check before speaking
      console.log("ContentReader: speakText called, but isReadingRef is false. Aborting speech.");
      if(onEndCallback) onEndCallback(); // To ensure sequence isn't broken if it relies on this
      return;
    }

    console.log(`ContentReader: Attempting to speak: "${textToSpeak.substring(0, 50)}..."`);
    
    // Clean up previous utterance if any
    if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
    }
    // Global cancel, only if absolutely necessary (e.g., user initiated stop)
    // For sequential speech, browser queueing is preferred.
    // synthRef.current.cancel(); // <-- This was likely causing interruptions

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    utterance.onend = () => {
        console.log(`ContentReader: Speech ended for: "${textToSpeak.substring(0, 50)}..."`);
        if (utteranceRef.current === utterance && isReadingRef.current) { // Check if still the current utterance and still reading
            utterance.onend = null; 
            utterance.onerror = null;
            utteranceRef.current = null; // Clear ref after handling
            if (onEndCallback) onEndCallback();
        } else {
            console.log("ContentReader: onend called for a stale/cancelled utterance or reading stopped.");
        }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        let errorDetails = "Unknown speech error";
        if (event && event.error) errorDetails = event.error;
        console.error('ContentReader: SpeechSynthesisUtterance.onerror for text:', `"${textToSpeak.substring(0,50)}..."`, 'Error details:', errorDetails);
        if (utteranceRef.current === utterance) {
            utterance.onend = null;
            utterance.onerror = null;
            utteranceRef.current = null;
        }
        handleStopReading(); // Stop the tour on any speech error
    };
    
    // Attempt to speak
    synthRef.current.speak(utterance);

  }, [handleStopReading]);


  const processSpeechQueue = useCallback(() => {
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
  
    if (!isReadingRef.current || sectionQueueRef.current.length === 0) {
      console.log("ContentReader: Queue empty or not actively reading.", {isReading: isReadingRef.current, queueLength: sectionQueueRef.current.length});
      if (isReadingRef.current && sectionQueueRef.current.length === 0) {
        // Should be handled by the last section's onAction: 'triggerTourComplete'
        console.log("ContentReader: Process queue called with empty queue while reading - implies tour should complete.");
        onTourComplete();
        handleStopReading();
      }
      return;
    }
  
    const section = sectionQueueRef.current.shift();
    if (!section) {
      console.log("ContentReader: No section (undefined) found in queue, stopping.");
      handleStopReading();
      onTourComplete();
      return;
    }
    
    currentSectionGlobalIndexRef.current = sectionsToReadData.findIndex(s => s.id === section.id);
    console.log(`ContentReader: Processing section: ${section.id} (Global Index: ${currentSectionGlobalIndexRef.current})`);
  
    if (!section.isSpecial) smoothScrollTo(section.id);

    speakText(section.speakableText, () => {
        if (!isReadingRef.current) return;

        if (section.onAction === 'triggerProjectsInteractive') {
            console.log("ContentReader: Reached projects interactive step. Calling onProjectsStepReached.");
            onProjectsStepReached();
            setIsReading(false); // Pause ContentReader; controller will resume if needed
            return; 
        } else if (section.onAction === 'triggerTourComplete') {
            console.log("ContentReader: Reached end of tour. Calling onTourComplete.");
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
                    if (!isReadingRef.current) return;
                    // The queue has already been shifted, so just process next
                    processSpeechQueue(); 
                }, section.autoAdvanceDelay || 100);
            } else {
                console.warn(`ContentReader: Auto-advance target "${nextSectionId}" not found. Stopping.`);
                handleStopReading();
            }
        } else if (sectionQueueRef.current.length > 0) {
             console.log("ContentReader: No auto-advance, but queue has items. Processing next for section:", section.id);
             processSpeechQueue();
        } else { // No autoAdvanceTo and queue is empty
            console.log("ContentReader: End of queue and no auto-advance. This case should be handled by onAction:triggerTourComplete for the last item.");
            onTourComplete(); // Fallback
            handleStopReading();
        }
    });
  }, [speakText, smoothScrollTo, onProjectsStepReached, onTourComplete, handleStopReading, sectionsToReadData]);


  const startReadingSequence = useCallback((startIndex: number) => {
    console.log(`ContentReader: startReadingSequence called, startIndex: ${startIndex}`);
    if (!isMountedRef.current || !synthRef.current) {
      console.warn("ContentReader: Cannot start reading, component not mounted or synth not ready.");
      setIsReading(false); // Ensure reading state is off if we can't start
      return;
    }

    // Clear any ongoing speech or timeouts from previous runs
    if (synthRef.current.speaking || synthRef.current.pending) {
        console.log("ContentReader (startReadingSequence): Cancelling existing speech before starting new sequence.");
        synthRef.current.cancel();
    }
    if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
    }
    if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
        tourTimeoutRef.current = null;
    }
    
    currentSectionGlobalIndexRef.current = startIndex;
    // Rebuild the queue from the current start index
    sectionQueueRef.current = sectionsToReadData.slice(startIndex);
    
    if (sectionQueueRef.current.length > 0) {
        console.log("ContentReader: Queue populated, setting isReading to true to trigger useEffect. Length:", sectionQueueRef.current.length);
        setIsReading(true); 
    } else {
      console.log("ContentReader: Queue is empty at startReadingSequence, not starting. Calling onTourComplete.");
      setIsReading(false);
      onTourComplete(); 
    }
  }, [setIsReading, sectionsToReadData, onTourComplete]);
  
  // Effect to start/stop queue processing based on isReading state
  useEffect(() => {
    if (isReading) {
      if (isMountedRef.current && synthRef.current && sectionQueueRef.current.length > 0) {
        console.log("ContentReader: isReading became true, calling processSpeechQueue. Queue length:", sectionQueueRef.current.length);
        processSpeechQueue();
      } else {
         console.log("ContentReader: isReading is true, but conditions not met to start queue processing (e.g., queue empty or synth not ready).");
         if (sectionQueueRef.current.length === 0) { // If queue is empty but we tried to start reading
            onTourComplete();
            handleStopReading();
         }
      }
    } else { // isReading is false
      console.log("ContentReader: isReading became false. Ensuring synth is cancelled and queue cleared.");
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
      if (synthRef.current?.speaking || synthRef.current?.pending) {
        synthRef.current.cancel();
      }
      if(utteranceRef.current){
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
      sectionQueueRef.current = []; // Clear the queue when reading stops
    }
  }, [isReading, processSpeechQueue, handleStopReading, onTourComplete]);


  // Effect to react to startTourSignal from parent
  useEffect(() => {
    if (currentGlobalStepId) {
        const globalStepIdx = sectionsToReadData.findIndex(s => s.id === currentGlobalStepId);
        if (globalStepIdx !== -1 && currentSectionGlobalIndexRef.current !== globalStepIdx) {
            console.log(`ContentReader: Global step ID changed to ${currentGlobalStepId}, updating internal index to ${globalStepIdx}`);
            currentSectionGlobalIndexRef.current = globalStepIdx;
        }
    }
    
    if (startTour && !isReadingRef.current && isMountedRef.current && synthRef.current) {
      console.log("ContentReader: startTourSignal is true. Calling startReadingSequence with index:", currentSectionGlobalIndexRef.current);
      startReadingSequence(currentSectionGlobalIndexRef.current);
    }
  }, [startTour, synthRef, startReadingSequence, currentGlobalStepId]);
  
  useEffect(() => {
    if (stopTourSignal && isReadingRef.current && isMountedRef.current) {
      console.log("ContentReader: stopTourSignal received. Calling handleStopReading.");
      handleStopReading();
    }
  }, [stopTourSignal, handleStopReading]);

  // Export project details for the controller to use when user clicks on a project in chat
  // This is a bit of a workaround; ideally, this data would be managed by the controller or a shared service.
  ContentReader.sectionsToReadData_FOR_DETAILS_ONLY = sectionsToReadData;

  return null; 
};

// Static property for controller access
ContentReader.sectionsToReadData_FOR_DETAILS_ONLY = sectionsToReadData;


export default ContentReader;

    