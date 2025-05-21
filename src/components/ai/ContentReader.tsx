"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface SectionToRead {
  id: string;
  speakableText: string;
  autoAdvanceTo?: string; 
  autoAdvanceDelay?: number;
  onAction?: 'triggerProjectsInteractive' | 'triggerTourComplete'; // Controller handles these now
}

const sectionsToReadData: SectionToRead[] = [
  { id: 'about', speakableText: "About Chakradhar: He is a passionate software engineer and AI developer specializing in full-stack development and intelligent data processing.", autoAdvanceTo: 'skills-section', autoAdvanceDelay: 100 },
  { id: 'skills-section', speakableText: "Regarding his technical skills: Chakradhar is proficient in Python, PySpark, DevOps methodologies, and various Machine Learning frameworks.", autoAdvanceTo: 'experience', autoAdvanceDelay: 100 },
  { id: 'experience', speakableText: "Moving to Chakradhar's experience: He interned at NSIC, developing an e-commerce platform, and at Zoho, optimizing backend performance for a video app.", autoAdvanceTo: 'projects', autoAdvanceDelay: 100 },
  { id: 'projects', speakableText: "Now, let's look at some of Chakradhar's key projects.", onAction: 'triggerProjectsInteractive' }, // Controller will handle detailed project speaking
  { id: 'education-section', speakableText: "About his education: Chakradhar is pursuing a Master of Science in Computer Science at The University of Texas at Dallas and holds a Bachelor's from R.M.K Engineering College.", autoAdvanceTo: 'certifications-section', autoAdvanceDelay: 100 },
  { id: 'certifications-section', speakableText: "He also holds certifications from IBM, Microsoft, Meta, and AWS.", autoAdvanceTo: 'publication-section', autoAdvanceDelay: 100 },
  { id: 'publication-section', speakableText: "His publication is on Text Detection Using Deep Learning, presented at an IEEE Conference.", autoAdvanceTo: 'contact', autoAdvanceDelay: 100 },
  { id: 'contact', speakableText: "This concludes the guided overview.", onAction: 'triggerTourComplete' },
];


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
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  const isMountedRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReadingRef = useRef(isReading); // To get latest isReading in callbacks

  useEffect(() => {
    isReadingRef.current = isReading;
  }, [isReading]);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`ContentReader: Scrolling to ${id}`);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn(`ContentReader: Element with id "${id}" not found for scrolling.`);
    }
  }, []);

  const stopCurrentSpeechAndClearQueue = useCallback(() => {
    if (synthRef.current) {
        if (utteranceRef.current) {
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
        }
        synthRef.current.cancel(); // Global cancel
        utteranceRef.current = null;
    }
    if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
        tourTimeoutRef.current = null;
    }
  }, []);

  const processNextSectionInQueue = useCallback(() => {
    if (!isMountedRef.current || !isReadingRef.current) {
      console.log("ContentReader: Not reading or not mounted, processNextSectionInQueue stopping.");
      setIsReading(false); // Ensure reading state is false if queue ends or stopped
      return;
    }

    if (currentSectionIndex >= sectionsToReadData.length) {
      console.log("ContentReader: Reached end of sectionsData.");
      onTourComplete();
      setIsReading(false);
      return;
    }

    const section = sectionsToReadData[currentSectionIndex];
    console.log(`ContentReader: Processing section: ${section.id} (Index: ${currentSectionIndex})`);

    if (section.id !== 'hero') { // Don't scroll for hero
        smoothScrollTo(section.id);
    }
    
    addMessageToChat('ai', <p>{section.speakableText}</p>, section.speakableText);

    speakTextProp(section.speakableText, () => { // onEnd callback
      if (!isMountedRef.current || !isReadingRef.current) return;

      if (section.onAction === 'triggerProjectsInteractive') {
        console.log("ContentReader: Reached projects interactive step, calling controller.");
        onProjectsStepReached();
        setIsReading(false); // Pause ContentReader
      } else if (section.onAction === 'triggerTourComplete') {
        console.log("ContentReader: Reached end of tour, calling controller.");
        onTourComplete();
        setIsReading(false);
      } else if (section.autoAdvanceTo) {
        const nextSectionGlobalIndex = sectionsToReadData.findIndex(s => s.id === section.autoAdvanceTo);
        if (nextSectionGlobalIndex !== -1) {
          if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
          tourTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && isReadingRef.current) {
              setCurrentSectionIndex(nextSectionGlobalIndex);
              // The useEffect watching currentSectionIndex will call processNextSectionInQueue
            }
          }, section.autoAdvanceDelay || 100);
        } else {
          console.warn(`ContentReader: autoAdvanceTo ID "${section.autoAdvanceTo}" not found. Ending tour.`);
          onTourComplete();
          setIsReading(false);
        }
      } else { // Should not happen if all sections have autoAdvanceTo or onAction (except the last one)
        console.log("ContentReader: Section has no autoAdvanceTo or onAction, ending tour.");
        onTourComplete();
        setIsReading(false);
      }
    }, true); // isChainedCall = true

  }, [
      currentSectionIndex, 
      smoothScrollTo, 
      speakTextProp, 
      addMessageToChat,
      onTourComplete, 
      onProjectsStepReached,
      setIsReading // Make sure setIsReading is included
    ]);

  // Effect to handle starting/resuming the tour
  useEffect(() => {
    if (startTourSignal && !isReading && isMountedRef.current) {
      console.log("ContentReader: startTourSignal is true, currentGlobalStepId:", currentGlobalStepId);
      let startIndex = 0;
      if (currentGlobalStepId) {
        const foundIndex = sectionsToReadData.findIndex(s => s.id === currentGlobalStepId);
        if (foundIndex !== -1) {
          startIndex = foundIndex;
        } else {
          console.warn(`ContentReader: currentGlobalStepId "${currentGlobalStepId}" not found. Starting from beginning.`);
        }
      }
      console.log(`ContentReader: Setting currentSectionIndex to ${startIndex} and isReading to true.`);
      setCurrentSectionIndex(startIndex);
      setIsReading(true); // This will trigger the effect below
    } else if (!startTourSignal && isReading && isMountedRef.current) {
        // If startTourSignal becomes false while reading, it's a signal to stop
        console.log("ContentReader: startTourSignal became false while reading, stopping.");
        stopCurrentSpeechAndClearQueue();
        setIsReading(false);
    }
  }, [startTourSignal, currentGlobalStepId, isReading, setCurrentSectionIndex, setIsReading, stopCurrentSpeechAndClearQueue]);

  // Effect to handle stopping the tour via stopTourSignal
  useEffect(() => {
    if (stopTourSignal && isReading && isMountedRef.current) {
      console.log("ContentReader: stopTourSignal is true, stopping reading.");
      stopCurrentSpeechAndClearQueue();
      setIsReading(false);
    }
  }, [stopTourSignal, isReading, stopCurrentSpeechAndClearQueue, setIsReading]);
  
  // Effect to process queue when isReading or currentSectionIndex changes
  useEffect(() => {
    if (isReading && isMountedRef.current) {
        console.log(`ContentReader: isReading is true or currentSectionIndex changed to ${currentSectionIndex}. Calling processNextSectionInQueue.`);
        processNextSectionInQueue();
    }
  }, [isReading, currentSectionIndex, processNextSectionInQueue]);

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      console.log("ContentReader: Speech synthesis API initialized.");
    } else {
      console.error("ContentReader: Speech synthesis not supported by this browser.");
    }
    return () => {
      isMountedRef.current = false;
      console.log("ContentReader: Unmounting. Stopping speech and clearing timeouts.");
      stopCurrentSpeechAndClearQueue();
    };
  }, [stopCurrentSpeechAndClearQueue]);

  return null; 
};

export default ContentReader;
