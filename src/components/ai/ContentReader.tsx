// src/components/ai/ContentReader.tsx
"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { AvatarAction } from './Avatar3D'; // Assuming AvatarAction is exported

interface ProjectDetail { // For project-specific details if needed by ContentReader
  title: string;
  description: string; // Short description for listing if any
  fullDescription: string; // Full description for detail view
  // technologies: string[]; // If needed
}

interface SectionToRead {
  id: string; // Corresponds to page section ID for scrolling
  speakableText: string; // Text for AI to speak for this section
  autoAdvanceTo?: string | null;
  autoAdvanceDelay?: number;
  onAction?: 'triggerProjectsInteractive' | 'triggerTourComplete';
  projectDetails?: ProjectDetail[]; // Only for the 'projects' section
}

// This data structure is now more detailed and serves as the script
const sectionsToReadData: SectionToRead[] = [
  { 
    id: "about", // Should match the ID of your "About Me" section wrapper
    speakableText: "Chakradhar is a versatile Software Engineer and Machine Learning practitioner. He has built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.", 
    autoAdvanceTo: "skills-section", 
    autoAdvanceDelay: 500 // ms after speech ends
  },
  { 
    id: "skills-section", 
    speakableText: "Regarding Chakradhar's Technical Skills: He primarily works with Python, Java, JavaScript, React, Node.js, various Machine Learning libraries like Scikit-learn and YOLO, and cloud technologies including AWS and Docker.", 
    autoAdvanceTo: "experience", 
    autoAdvanceDelay: 500 
  },
  { 
    id: "experience", 
    speakableText: "For work experience: At NSIC Technical Services Centre, Chakradhar developed an e-commerce platform and enhanced login security. At Zoho Corporation, he optimized backend performance for a video conferencing application and integrated WebRTC for over a thousand concurrent users.", 
    autoAdvanceTo: "projects", 
    autoAdvanceDelay: 500 
  },
  { 
    id: "projects", // This is the general intro for the projects section
    speakableText: "Chakradhar has led and contributed to impactful projects. I will now list their titles. You can then select one for more details or move to the next section.",
    onAction: 'triggerProjectsInteractive', // Signals controller to show project buttons
    projectDetails: [ // These descriptions are for when the user clicks in the chat
      { title: "AI-Powered Smart Detection of Crops and Weeds", description: "Brief desc...", fullDescription: "He built a YOLO-based object detection system with 90% accuracy for identifying crops and weeds. This helped reduce herbicide usage by 15%." },
      { title: "Search Engine for Movie Summaries", description: "Brief desc...", fullDescription: "Using PySpark and Hadoop, he developed a search engine that improves query relevance with TF-IDF and cosine similarity across 100K+ records." },
      { title: "Facial Recognition Attendance System", description: "Brief desc...", fullDescription: "Designed a face-recognition attendance system using OpenCV, achieving 99% accuracy for 200+ users, with real-time cloud syncing." },
      { title: "Mushroom Classification with Scikit-Learn", description: "Brief desc...", fullDescription: "Used ensemble models like Decision Tree, Random Forest, and KNN to classify mushrooms with 95% accuracy, even with 20% missing data." },
      { title: "Custom Process Scheduler Development", description: "Brief desc...", fullDescription: "Programmed priority and lottery-based schedulers in xv6/Linux kernel, reducing context-switching by 18% and validating fairness with simulations." }
    ]
  },
  { 
    id: "education-section", 
    speakableText: "Regarding education: Chakradhar is pursuing an M.S. in Computer Science at The University of Texas at Dallas, expecting to graduate in May 2025, and holds a B.E. in Electronics and Communication from R.M.K. Engineering College, India.", 
    autoAdvanceTo: "certifications-section", 
    autoAdvanceDelay: 500 
  },
  { 
    id: "certifications-section", 
    speakableText: "Chakradhar holds certifications from leading organizations including IBM for DevOps & Software Engineering, Microsoft as a Full-Stack Developer, Meta as a Back-End Developer, and is an AWS Certified Cloud Practitioner.", 
    autoAdvanceTo: "publication-section", 
    autoAdvanceDelay: 500 
  },
  { 
    id: "publication-section", 
    speakableText: "His publication is titled 'Text Detection Using Deep Learning'. In this work, he built a handwriting recognition model using MNIST-style data, reaching 98.6% training accuracy. This was presented at an IEEE Intelligent Data Communication and Analytics Conference.", 
    autoAdvanceTo: "additional_info", 
    autoAdvanceDelay: 500 
  },
  { 
    id: "additional_info", // Placeholder ID, might need a dedicated section on page or just be spoken
    speakableText: "Additionally, Chakradhar is proficient with Git, Linux, and REST APIs. He has a strong foundation in Java programming, including object-oriented design and multithreading, and is experienced in model evaluation, preprocessing, and computer vision using Scikit-learn and YOLO.", 
    onAction: 'triggerTourComplete' 
  },
];


interface ContentReaderProps {
  startSignal: boolean;
  stopSignal: boolean;
  currentSectionIdToSpeak: string | null;
  onSectionSpoken: (sectionId: string, text: string) => void;
  onProjectsIntroSpoken: () => void;
  onTourComplete: () => void;
  speakTextProp: (text: string, onEnd?: () => void, isChainedCall?: boolean) => void; // From controller
  setAvatarActionProp: (action: AvatarAction) => void; // From controller
}

const ContentReader: React.FC<ContentReaderProps> = ({
  startSignal,
  stopSignal,
  currentSectionIdToSpeak,
  onSectionSpoken,
  onProjectsIntroSpoken,
  onTourComplete,
  speakTextProp,
  setAvatarActionProp
}) => {
  const [isReadingInternally, setIsReadingInternally] = useState(false);
  const isReadingRef = useRef(isReadingInternally);

  const sectionQueueRef = useRef<SectionToRead[]>([]);
  const currentSectionIndexRef = useRef(0);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isReadingRef.current = isReadingInternally;
  }, [isReadingInternally]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
      // Speech cancellation should be handled by the controller if it's managing the synth instance
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
  
  const handleStopReading = useCallback(() => {
    console.log("ContentReader: handleStopReading called.");
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    setIsReadingInternally(false);
    // Any global speech cancellation is now handled by the controller via stopSignal
  }, [setIsReadingInternally]);


  const processSpeechQueue = useCallback(() => {
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);

    if (!isReadingRef.current || sectionQueueRef.current.length === 0) {
      console.log("ContentReader: Queue empty or not reading. Stopping/Completing.", {isReading: isReadingRef.current, queueLength: sectionQueueRef.current.length});
      if (isReadingRef.current && sectionQueueRef.current.length === 0) { // If it was reading and queue just emptied
        onTourComplete();
      }
      handleStopReading();
      return;
    }

    const section = sectionQueueRef.current.shift();
    if (section) {
      console.log(`ContentReader: Processing section from queue: ${section.id}`);
      currentSectionIndexRef.current = sectionsToReadData.findIndex(s => s.id === section.id);
      smoothScrollTo(section.id);
      setAvatarActionProp('pointing'); // Point to the section

      // Delay slightly after pointing before speaking
      setTimeout(() => {
        if (!isReadingRef.current || !isMountedRef.current) return;

        onSectionSpoken(section.id, section.speakableText); // Inform controller to display text
        speakTextProp(section.speakableText, () => { // onEnd callback for this utterance
          if (!isMountedRef.current) return;
          setAvatarActionProp('idle'); // Reset avatar after speaking this section part

          if (section.onAction) {
            console.log(`ContentReader: Section ${section.id} has onAction: ${section.onAction}`);
            if (section.onAction === 'triggerProjectsInteractive') {
              onProjectsIntroSpoken(); // Controller will now show project buttons and speak
              handleStopReading(); // Pause ContentReader's own sequence
            } else if (section.onAction === 'triggerTourComplete') {
              onTourComplete();
              handleStopReading();
            }
          } else if (section.autoAdvanceTo) {
            const nextSectionDetail = sectionsToReadData.find(s => s.id === section.autoAdvanceTo);
            if (nextSectionDetail) {
              const nextSectionIndex = sectionsToReadData.findIndex(s => s.id === section.autoAdvanceTo);
              console.log(`ContentReader: Auto-advancing to ${section.autoAdvanceTo} after delay.`);
              tourTimeoutRef.current = setTimeout(() => {
                if (isReadingRef.current && isMountedRef.current) {
                  currentSectionIndexRef.current = nextSectionIndex;
                  sectionQueueRef.current = sectionsToReadData.slice(nextSectionIndex);
                  processSpeechQueue();
                }
              }, section.autoAdvanceDelay || 200); // Short delay for transition
            } else {
              console.warn(`ContentReader: autoAdvanceTo section ID "${section.autoAdvanceTo}" not found.`);
              onTourComplete();
              handleStopReading();
            }
          } else if (sectionQueueRef.current.length > 0) {
             console.log("ContentReader: No autoAdvanceTo, but queue not empty, processing next directly after short delay.");
             tourTimeoutRef.current = setTimeout(() => {
                if (isReadingRef.current && isMountedRef.current) processSpeechQueue();
             }, 200);
          } else { // Queue is empty, no autoAdvanceTo, not an onAction handled above
            console.log("ContentReader: Reached end of queue naturally.");
            onTourComplete();
            handleStopReading();
          }
        }, true); // true for isChainedCall, as controller handles initial cancel for sequence
      }, 750); // Delay for pointing animation to be visible

    } else {
      console.log("ContentReader: Queue was not empty but shift returned undefined. Stopping.");
      onTourComplete();
      handleStopReading();
    }
  }, [smoothScrollTo, onSectionSpoken, speakTextProp, onProjectsIntroSpoken, onTourComplete, handleStopReading, setAvatarActionProp]);

  const startReadingSequence = useCallback((startIndex: number) => {
    if (!isMountedRef.current) return;
    console.log(`ContentReader: STARTING sequence from index: ${startIndex}, sectionId: ${sectionsToReadData[startIndex]?.id}`);
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    
    currentSectionIndexRef.current = startIndex;
    sectionQueueRef.current = sectionsToReadData.slice(startIndex);
    
    if (sectionQueueRef.current.length > 0) {
        setIsReadingInternally(true); // This will trigger the useEffect below
    } else {
        console.log("ContentReader: startReadingSequence called but no sections to read from startIndex.");
        onTourComplete(); // Or handle as appropriate
        handleStopReading();
    }
  }, [setIsReadingInternally, onTourComplete, handleStopReading]);

  // Effect to start/stop processing based on isReadingInternally state
  useEffect(() => {
    if (isReadingInternally && sectionQueueRef.current.length > 0 && isMountedRef.current) {
      console.log("ContentReader: isReadingInternally is true, calling processSpeechQueue. Queue length:", sectionQueueRef.current.length);
      processSpeechQueue();
    } else if (!isReadingInternally && isMountedRef.current) { // If isReadingInternally is false, ensure cleanup
      console.log("ContentReader: isReadingInternally is false. Ensuring tour is stopped.");
      handleStopReading(); // This also clears tourTimeoutRef
    }
  }, [isReadingInternally, processSpeechQueue, handleStopReading]);


  // Effect to react to external start/stop signals from controller
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (startSignal && !isReadingRef.current) { 
      console.log("ContentReader: Received startSignal. currentSectionIdToSpeak:", currentSectionIdToSpeak);
      let startIndex = 0;
      if (currentSectionIdToSpeak) {
        const foundIndex = sectionsToReadData.findIndex(s => s.id === currentSectionIdToSpeak);
        if (foundIndex !== -1) {
          startIndex = foundIndex;
        } else {
          console.warn(`ContentReader: currentSectionIdToSpeak "${currentSectionIdToSpeak}" not found, starting from beginning.`);
        }
      }
      startReadingSequence(startIndex);
    } else if (stopSignal && isReadingRef.current) {
      console.log("ContentReader: Received stopSignal. Stopping reading.");
      handleStopReading();
    }
  }, [startSignal, stopSignal, currentSectionIdToSpeak, startReadingSequence, handleStopReading]);

  return null; 
};

ContentReader.sectionsToReadData_FOR_DETAILS_ONLY = sectionsToReadData;

export default ContentReader;
