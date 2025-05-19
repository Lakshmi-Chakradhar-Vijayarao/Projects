
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SectionToRead {
  id: string;
  speakableText: string;
  isSpecial?: boolean; 
  autoAdvanceTo?: string; // Next step key
  autoAdvanceDelay?: number; // Milliseconds
}

const sectionsToReadData: SectionToRead[] = [
  // Welcome message is now handled by IntegratedAssistantController
  { 
    id: 'about', // Will scroll to #about-me-section
    speakableText: "Chakradhar is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.",
    autoAdvanceTo: 'skills_intro',
    autoAdvanceDelay: 12000 // Example: 12 seconds for summary
  },
  { 
    id: 'skills-section', 
    speakableText: "Here’s what Chakradhar works with regularly: Languages: Python, Java, JavaScript, C++, C, C#. Web and ML Libraries: React, Node, Express, Django, Scikit-learn, YOLO, OpenCV. Data and Cloud: PySpark, Hadoop, Databricks, AWS, Docker. Databases: MySQL, PostgreSQL, Oracle. Tools: Git, Linux, VS Code, REST APIs. And Practices like Agile, CI/CD, and API Design.",
    autoAdvanceTo: 'experience_intro',
    autoAdvanceDelay: 18000 // Example: 18 seconds for skills
  },
  { 
    id: 'experience', 
    speakableText: "Regarding his experience: At NSIC Technical Services Centre in Chennai, as an Intern from April to June 2023, Chakradhar built an e-commerce platform, secured login with OAuth2 and JWT, and conducted Android full-stack training. At Zoho Corporation, also in Chennai, as a Summer Internship Project Associate from March to April 2022, he refined backend APIs for a video app, integrated WebRTC for over a thousand real-time users, and collaborated in Agile sprints.",
    autoAdvanceTo: 'projects_list_intro', // This will pause for chatbot interaction
    autoAdvanceDelay: 20000 // Example: 20 seconds for experience
  },
  // Projects section is handled interactively by IntegratedAssistantController
  { 
    id: 'education-section', 
    speakableText: "His education includes a Master of Science in Computer Science from The University of Texas at Dallas, with a GPA of 3.607, and a Bachelor of Engineering in Electronics and Communication from R.M.K Engineering College, India, with a GPA of 9.04.",
    autoAdvanceTo: 'certifications_intro',
    autoAdvanceDelay: 15000 
  },
  { 
    id: 'certifications-section', 
    speakableText: "Chakradhar holds certifications from leading organizations: IBM DevOps and Software Engineering, Microsoft Full-Stack Developer, Meta Back-End Developer, and AWS Certified Cloud Practitioner.",
    autoAdvanceTo: 'publication_intro',
    autoAdvanceDelay: 12000
  },
  { 
    id: 'publication-section', 
    speakableText: "His publication is 'Text Detection Using Deep Learning', where he built a handwriting recognition model achieving 98.6% training accuracy, presented at an IEEE Conference.",
    autoAdvanceTo: 'additional_info_intro',
    autoAdvanceDelay: 10000
  },
  { 
    id: 'contact', // Or a dedicated 'additional-info' section if it exists
    speakableText: "Additionally, Chakradhar is proficient with Git, Linux, and REST APIs, has a strong OOP and multithreading background in Java, and is experienced in model evaluation and computer vision with Scikit-learn and YOLO.",
    isSpecial: true, // Indicates it's the last content piece of the tour
    autoAdvanceDelay: 12000 // No autoAdvanceTo, onTourComplete will be called after this
  },
];


interface ContentReaderProps {
  startTour: boolean;
  onTourComplete: () => void;
  stopTourSignal: boolean;
}

const ContentReader: React.FC<ContentReaderProps> = ({ startTour, onTourComplete, stopTourSignal }) => {
  const [isReading, setIsReading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sectionQueueRef = useRef<SectionToRead[]>([]);
  const currentSectionIndexRef = useRef(0); // To track which section is currently being read or was last read
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      console.log("ContentReader: Speech synthesis initialized.");
    } else {
      console.warn("ContentReader: Speech synthesis not supported or not available.");
    }
    return () => {
      console.log("ContentReader: Unmounting. Cancelling speech and timeout.");
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current.onend = null;
        currentUtteranceRef.current.onerror = null;
      }
      if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
      }
    };
  }, []);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`ContentReader: Scrolling to section: ${id}`);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`ContentReader: Element with id ${id} not found for scrolling.`);
    }
  }, []);

  const speakText = useCallback((textToSpeak: string, onEndCallback?: () => void) => {
    if (!isMounted || !synthRef.current || !textToSpeak) {
      console.warn("ContentReader: SpeakText called prematurely or with no text.");
      if (onEndCallback) onEndCallback(); // Ensure callback fires to prevent stalls
      return;
    }
    console.log(`ContentReader: Attempting to speak: "${textToSpeak.substring(0,50)}..."`);

    // Cancel any ongoing speech *before* creating a new utterance
    if (synthRef.current.speaking || synthRef.current.pending) {
        console.log("ContentReader: Cancelling existing speech before speaking new text.");
        // Detach handlers from the current/old utterance *before* cancelling
        if (currentUtteranceRef.current) {
            currentUtteranceRef.current.onend = null;
            currentUtteranceRef.current.onerror = null;
        }
        synthRef.current.cancel(); 
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    currentUtteranceRef.current = utterance;

    utterance.onend = () => {
      console.log(`ContentReader: Speech ended for: "${textToSpeak.substring(0,50)}..."`);
      if (currentUtteranceRef.current === utterance) { 
        utterance.onend = null; 
        utterance.onerror = null; 
        currentUtteranceRef.current = null;
        if (onEndCallback) onEndCallback();
      } else {
        console.log("ContentReader: onend called for a stale utterance.");
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error;
      }
      console.error('ContentReader: SpeechSynthesisUtterance.onerror for text:', `"${textToSpeak.substring(0,50)}..."`, 'Error details:', errorDetails);
      if (currentUtteranceRef.current === utterance) {
        utterance.onend = null; 
        utterance.onerror = null; 
        currentUtteranceRef.current = null;
      }
      setIsReading(false); 
      if (onEndCallback) onEndCallback(); // Still call callback to attempt to clear or move on
    };
    
    synthRef.current.speak(utterance);
  }, [isMounted, synthRef]);

  const processSpeechQueue = useCallback(() => {
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);

    if (!isReading || sectionQueueRef.current.length === 0) {
      console.log("ContentReader: Queue empty or not reading. Tour complete or stopped.");
      setIsReading(false);
      if (sectionQueueRef.current.length === 0 && isReading) { 
        onTourComplete();
      }
      return;
    }

    const section = sectionQueueRef.current.shift();
    if (!section) {
      console.log("ContentReader: No section found in queue, ending tour.");
      setIsReading(false);
      onTourComplete();
      return;
    }

    currentSectionIndexRef.current = sectionsToReadData.findIndex(s => s.id === section.id && s.speakableText === section.speakableText); // More specific find

    if (!section.isSpecial) {
      smoothScrollTo(section.id);
    }

    speakText(section.speakableText, () => {
      if (section.autoAdvanceTo) {
        const nextStepKey = section.autoAdvanceTo;
        const nextSectionDetail = sectionsToReadData.find(s => s.id === nextStepKey || (s.isSpecial && s.id === nextStepKey)); // simplistic match, might need refinement
        if (nextSectionDetail) { // Check if nextSectionDetail is found
            console.log(`ContentReader: Auto-advancing to ${nextStepKey} after ${section.autoAdvanceDelay}ms`);
            tourTimeoutRef.current = setTimeout(() => {
              // Directly add the next section to the front of the queue and process
              sectionQueueRef.current.unshift(nextSectionDetail);
              processSpeechQueue();
            }, section.autoAdvanceDelay || 100); // Default to 100ms if no delay specified
        } else {
            console.warn(`ContentReader: Next section key "${nextStepKey}" not found in sectionsToReadData.`);
            processSpeechQueue(); // Try to process next in queue if current auto-advance target is bad
        }
      } else {
        // If no autoAdvanceTo, it means this part of the tour is done or an interactive step is next.
        // The onTourComplete will be handled by the parent when the queue is fully empty.
        processSpeechQueue(); // Continue processing if anything is left (e.g. if a special outro was added)
      }
    });

  }, [isReading, setIsReading, sectionsToReadData, smoothScrollTo, speakText, onTourComplete]);


  const startReadingSequence = useCallback(() => {
    console.log("ContentReader: startReadingSequence called.");
    if (!isMounted || !synthRef.current) {
      console.warn("ContentReader: startReadingSequence called before component mounted or synth ready.");
      return;
    }
    
    if (synthRef.current.speaking) { // Cancel any prior speech explicitly if starting a new sequence
        synthRef.current.cancel();
    }
    if (currentUtteranceRef.current) { // Clean up old utterance refs
        currentUtteranceRef.current.onend = null;
        currentUtteranceRef.current.onerror = null;
        currentUtteranceRef.current = null;
    }

    setIsReading(true);
    // Start with the first *actual* section, not a pre-welcome from ContentReader
    sectionQueueRef.current = sectionsToReadData.filter(s => s.id !== 'welcome-tour'); 
    currentSectionIndexRef.current = 0; 
    
    if (sectionQueueRef.current.length > 0) {
      processSpeechQueue(); // Kick off the queue processing
    } else {
      console.log("ContentReader: No sections to read in startReadingSequence.");
      setIsReading(false);
      onTourComplete();
    }
  }, [isMounted, setIsReading, sectionsToReadData, processSpeechQueue, onTourComplete]);

  useEffect(() => {
    if (startTour && !isReading && isMounted) {
      console.log("ContentReader: Start tour signal received, calling startReadingSequence.");
      startReadingSequence();
    }
  }, [startTour, isReading, isMounted, startReadingSequence]);
  
  useEffect(() => {
    if (stopTourSignal && isReading && isMounted) {
      console.log("ContentReader: Stop tour signal received. Stopping speech and clearing queue.");
      if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
        tourTimeoutRef.current = null;
      }
      if (synthRef.current) {
        if (currentUtteranceRef.current) {
            currentUtteranceRef.current.onend = null;
            currentUtteranceRef.current.onerror = null;
        }
        synthRef.current.cancel();
      }
      currentUtteranceRef.current = null;
      sectionQueueRef.current = [];
      setIsReading(false);
    }
  }, [stopTourSignal, isReading, isMounted, setIsReading]);

  return null; // This component is now fully controlled, no UI of its own.
};

export default ContentReader;

    