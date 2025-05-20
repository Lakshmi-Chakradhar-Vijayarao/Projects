
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SectionToRead {
  id: string;
  speakableText: string;
  isSpecial?: boolean;
  onAction?: 'triggerProjectsInteractive' | 'triggerTourComplete';
  autoAdvanceTo?: string;
  autoAdvanceDelay?: number;
}

const sectionsToReadData: SectionToRead[] = [
  {
    id: 'about',
    speakableText: "About Chakradhar: He is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.",
    autoAdvanceTo: 'skills-section',
    autoAdvanceDelay: 100 // Quick auto-advance
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
    autoAdvanceTo: 'projects_intro', // This will trigger the controller to speak project titles
    autoAdvanceDelay: 100
  },
  {
    id: 'projects_intro', // Controller will handle speaking project titles after this.
    speakableText: "Chakradhar has led and contributed to impactful projects. I will now list them briefly.",
    isSpecial: true,
    onAction: 'triggerProjectsInteractive', // Signal controller to take over for project title narration & interaction
    // No autoAdvanceTo here; controller manages the next step.
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
    autoAdvanceDelay: 100
  },
];


interface ContentReaderProps {
  startTourSignal: boolean;
  stopTourSignal: boolean;
  onTourComplete: () => void;
  onProjectsStepReached: () => void; // Called when 'projects_intro' is spoken
  currentGlobalStepId?: string;
}

const ContentReader: React.FC<ContentReaderProps> = ({
  startTourSignal,
  stopTourSignal,
  onTourComplete,
  onProjectsStepReached,
  currentGlobalStepId
}) => {
  const [isReading, setIsReading] = useState(false);
  const isReadingRef = useRef(isReading);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sectionQueueRef = useRef<SectionToRead[]>([]);
  const currentSectionIndexRef = useRef(0);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

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
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`ContentReader: Element with id #${id} not found for scrolling.`);
    }
  }, []);
  
  const handleStopReading = useCallback(() => {
    console.log("ContentReader: handleStopReading called. Clearing queue and cancelling speech.");
    setIsReading(false); // This will trigger the useEffect to stop synth and clear queue.
  }, [setIsReading]);

  const speakText = useCallback((textToSpeak: string, onEndCallback?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !textToSpeak || !isReadingRef.current) {
      console.warn("ContentReader: SpeakText conditions not met or not actively reading.", {isMounted: isMountedRef.current, synth: !!synthRef.current, text: !!textToSpeak, isReading: isReadingRef.current});
      if(onEndCallback) onEndCallback();
      return;
    }
    console.log(`ContentReader: Attempting to speak: "${textToSpeak.substring(0, 50)}..."`);
    
    if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    utterance.onend = () => {
      if (utteranceRef.current === utterance && isReadingRef.current) {
        console.log(`ContentReader: Speech ended for: "${textToSpeak.substring(0, 50)}..."`);
        utterance.onend = null; 
        utterance.onerror = null;
        // utteranceRef.current = null; // Don't null here, onend might be called before next processSpeechQueue
        if (onEndCallback) onEndCallback();
      } else {
         console.log("ContentReader: onend called for stale/cancelled utterance or reading stopped.");
      }
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) errorDetails = event.error;
      console.error('ContentReader: SpeechSynthesisUtterance.onerror for text:', `"${textToSpeak.substring(0,50)}..."`, 'Error details:', errorDetails, 'Event object:', event);
      if (utteranceRef.current === utterance) {
          utterance.onend = null;
          utterance.onerror = null;
          utteranceRef.current = null;
      }
      handleStopReading();
    };
    synthRef.current.speak(utterance);
  }, [handleStopReading]);

  const processSpeechQueue = useCallback(() => {
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);

    if (!isReadingRef.current || sectionQueueRef.current.length === 0) {
      console.log("ContentReader: Queue empty or not actively reading. Calling onTourComplete if reading.", { isReading: isReadingRef.current, queueLength: sectionQueueRef.current.length });
      if (isReadingRef.current && sectionQueueRef.current.length === 0) {
        onTourComplete();
        handleStopReading();
      }
      return;
    }

    const section = sectionQueueRef.current.shift();
    if (!section) {
      handleStopReading();
      onTourComplete();
      return;
    }
    
    const currentGlobalIndex = sectionsToReadData.findIndex(s => s.id === section.id);
    currentSectionIndexRef.current = currentGlobalIndex;
    console.log(`ContentReader: Processing section: ${section.id} (Index: ${currentGlobalIndex})`);

    if (!section.isSpecial) smoothScrollTo(section.id);

    speakText(section.speakableText, () => {
      if (!isReadingRef.current) return;

      if (section.onAction === 'triggerProjectsInteractive') {
        console.log("ContentReader: Reached projects interactive trigger. Calling onProjectsStepReached and pausing ContentReader.");
        onProjectsStepReached();
        setIsReading(false); // Pause ContentReader; controller will resume if needed.
        return;
      } else if (section.onAction === 'triggerTourComplete') {
        console.log("ContentReader: Reached end of tour action. Calling onTourComplete.");
        onTourComplete();
        setIsReading(false);
        return;
      }

      if (section.autoAdvanceTo) {
        const nextSectionId = section.autoAdvanceTo;
        const nextIndex = sectionsToReadData.findIndex(s => s.id === nextSectionId);
        if (nextIndex !== -1) {
          console.log(`ContentReader: Auto-advancing to ${nextSectionId} after ${section.autoAdvanceDelay || 100}ms`);
          tourTimeoutRef.current = setTimeout(() => {
            if (!isReadingRef.current) return;
            // Rebuild queue for the next specific section
            sectionQueueRef.current = sectionsToReadData.slice(nextIndex);
            processSpeechQueue();
          }, section.autoAdvanceDelay || 100);
        } else {
          console.warn(`ContentReader: Auto-advance target "${nextSectionId}" not found. Stopping.`);
          handleStopReading();
        }
      } else if (sectionQueueRef.current.length > 0) { // No auto-advance, but queue has more items (should be handled by autoAdvanceTo for continuous tour)
         console.log("ContentReader: No auto-advance, but queue has items. Processing next for section:", section.id);
         processSpeechQueue(); 
      } else { // No autoAdvanceTo and queue is now empty
        console.log("ContentReader: End of queue and no auto-advance. This case usually handled by onAction:triggerTourComplete or special step.");
        onTourComplete(); 
        handleStopReading();
      }
    });
  }, [speakText, smoothScrollTo, onProjectsStepReached, onTourComplete, handleStopReading, setIsReading]);

  const startReadingSequence = useCallback((startIndex: number) => {
    if (!isMountedRef.current || !synthRef.current) {
      console.warn("ContentReader: Cannot start reading, component not mounted or synth not ready.");
      setIsReading(false);
      return;
    }
    console.log(`ContentReader: startReadingSequence called with startIndex: ${startIndex}, sectionId: ${sectionsToReadData[startIndex]?.id}`);
    
    if (synthRef.current.speaking || synthRef.current.pending) {
        if (utteranceRef.current) {
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
        }
        synthRef.current.cancel();
        console.log("ContentReader (startReadingSequence): Cancelled existing speech.");
    }
    utteranceRef.current = null;

    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    
    currentSectionIndexRef.current = startIndex;
    sectionQueueRef.current = sectionsToReadData.slice(startIndex);
    
    if (sectionQueueRef.current.length > 0) {
      console.log("ContentReader: Queue populated. Setting isReading to true. Queue Length:", sectionQueueRef.current.length);
      setIsReading(true); // This will trigger the useEffect to call processSpeechQueue
    } else {
      console.log("ContentReader: Queue is empty at startReadingSequence, not starting. Calling onTourComplete.");
      setIsReading(false);
      onTourComplete();
    }
  }, [setIsReading, onTourComplete]);
  
  useEffect(() => {
    if (isReading) {
      if (isMountedRef.current && synthRef.current && sectionQueueRef.current.length > 0) {
        console.log("ContentReader: isReading became true, starting/resuming processSpeechQueue. Queue length:", sectionQueueRef.current.length);
        processSpeechQueue();
      } else if (isMountedRef.current && synthRef.current && sectionQueueRef.current.length === 0) {
         console.log("ContentReader: isReading is true, but queue became empty. Tour should be complete.");
         onTourComplete();
         handleStopReading();
      }
    } else { // isReading is false
      console.log("ContentReader: isReading became false. Ensuring synth is cancelled and queue/timeout cleared.");
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
      if (synthRef.current?.speaking || synthRef.current?.pending) {
        if (utteranceRef.current) {
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
        }
        synthRef.current.cancel();
      }
      utteranceRef.current = null;
      sectionQueueRef.current = []; 
    }
  }, [isReading, processSpeechQueue, onTourComplete, handleStopReading]);

  useEffect(() => {
    if (startTourSignal && !isReadingRef.current && isMountedRef.current && synthRef.current) {
        const globalStepIdx = sectionsToReadData.findIndex(s => s.id === currentGlobalStepId);
        const startIndexToUse = globalStepIdx !== -1 ? globalStepIdx : 0; // Default to 0 if currentGlobalStepId is invalid
        console.log(`ContentReader: startTourSignal received. Starting sequence from index: ${startIndexToUse} (derived from currentGlobalStepId: ${currentGlobalStepId})`);
        startReadingSequence(startIndexToUse);
    }
  }, [startTourSignal, currentGlobalStepId, startReadingSequence]); 
  
  useEffect(() => {
    if (stopTourSignal && isReadingRef.current && isMountedRef.current) {
      console.log("ContentReader: stopTourSignal received. Calling handleStopReading.");
      handleStopReading();
    }
  }, [stopTourSignal, handleStopReading]);

  return null; 
};

export default ContentReader;
