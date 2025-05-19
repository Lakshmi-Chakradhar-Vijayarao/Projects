
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Icon } from 'lucide-react'; // For QuickReplyButton typing

interface SectionToRead {
  id: string;
  speakableText: string;
  isSpecial?: boolean;
  outroMessage?: string;
}

const sectionsToReadData: SectionToRead[] = [
  // Welcome message is now handled by InteractiveChatbot via IntegratedAssistantController
  { id: 'about', speakableText: "About Chakradhar: He's a passionate software engineer and AI developer specializing in full-stack development and intelligent data processing." },
  { id: 'experience', speakableText: "Experience: Highlighting internships at NSIC Technical Services Centre and Zoho Corporation, focusing on e-commerce, API optimization, and real-time communication." },
  { id: 'projects', speakableText: "Projects: Showcasing impactful work in AI-powered detection, search engines, facial recognition, and system schedulers." },
  { id: 'skills-section', speakableText: "Skills: Detailing Chakradhar's proficiency in programming languages, frameworks, data technologies, and development methodologies." },
  { id: 'education-section', speakableText: "Education: Master's from The University of Texas at Dallas and Bachelor's from R.M.K. Engineering College." },
  { id: 'certifications-section', speakableText: "Certifications: Including IBM DevOps, Microsoft Full-Stack, Meta Back-End, and AWS Certified Cloud Practitioner." },
  { id: 'publication-section', speakableText: "Publication: Featuring Chakradhar's work on Text Detection Based on Deep Learning presented at an IEEE conference." },
  { id: 'outro', speakableText: "This concludes the overview of Chakradhar's portfolio.", isSpecial: true },
];

interface ContentReaderProps {
  startTour: boolean;
  onTourComplete: () => void;
  stopTourSignal: boolean; // New prop to signal stop from parent
}

const ContentReader: React.FC<ContentReaderProps> = ({ startTour, onTourComplete, stopTourSignal }) => {
  const [isReading, setIsReading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sectionQueueRef = useRef<SectionToRead[]>([]);
  const currentSectionIndexRef = useRef(0); // To keep track of the current section

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
    };
  }, []);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const processSpeechQueue = useCallback(() => {
    if (!isReading || sectionQueueRef.current.length === 0 || !synthRef.current || !isMounted) {
      setIsReading(false);
      if (isMounted && sectionQueueRef.current.length === 0 && isReading) { // Ensure tour completion is only called if it was reading
        onTourComplete();
      }
      return;
    }

    const section = sectionQueueRef.current.shift();
    if (!section) {
      setIsReading(false);
      if (isMounted) onTourComplete();
      return;
    }

    if (!section.isSpecial && section.id !== 'outro') {
      smoothScrollTo(section.id);
    }

    const utterance = new SpeechSynthesisUtterance(section.speakableText);
    utteranceRef.current = utterance;

    utterance.onend = () => {
      if (utteranceRef.current === utterance) { // Ensure it's the current utterance
        utteranceRef.current = null;
        if (sectionQueueRef.current.length === 0) { // Last actual section was "outro"
          setIsReading(false);
          if (isMounted) onTourComplete();
        } else {
          processSpeechQueue();
        }
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error;
      }
      console.error('SpeechSynthesisUtterance.onerror for text:', `"${section.speakableText}"`, 'Error details:', errorDetails, 'Full event object:', event);
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
      }
      setIsReading(false);
      // Optionally call onTourComplete here or allow user to retry? For now, just stops.
    };

    const trySpeak = () => {
      if (synthRef.current && utteranceRef.current === utterance && isMounted) {
        synthRef.current.speak(utterance);
      }
    };
    
    if (synthRef.current?.getVoices().length > 0) {
      trySpeak();
    } else if (synthRef.current) {
      const voiceChangeHandler = () => {
        if(synthRef.current) synthRef.current.onvoiceschanged = null; // Detach listener
        trySpeak();
      };
      synthRef.current.onvoiceschanged = voiceChangeHandler;
      // Fallback timeout in case onvoiceschanged doesn't fire reliably
      setTimeout(() => {
        if (synthRef.current && synthRef.current.onvoiceschanged === voiceChangeHandler) {
           synthRef.current.onvoiceschanged = null;
           trySpeak();
        }
      }, 250);
    }

  }, [isReading, smoothScrollTo, onTourComplete, isMounted, setIsReading]); // Added setIsReading

  useEffect(() => {
    if (startTour && !isReading && isMounted) {
      setIsReading(true);
      sectionQueueRef.current = [...sectionsToReadData];
      currentSectionIndexRef.current = 0; // Reset index
      // The actual start of speech processing is handled by the effect below
    }
  }, [startTour, isReading, isMounted]);

  useEffect(() => {
    if (isReading && isMounted && sectionQueueRef.current.length > 0 && !synthRef.current?.speaking) {
      processSpeechQueue();
    }
  }, [isReading, isMounted, processSpeechQueue]);


  useEffect(() => {
    if (stopTourSignal && isReading && isMounted) {
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
      sectionQueueRef.current = [];
      setIsReading(false);
      // onTourComplete is not called here, as this is an interruption
    }
  }, [stopTourSignal, isReading, isMounted, setIsReading]);


  // This component no longer renders its own UI button.
  // Control is handled by IntegratedAssistantController.
  return null; 
};

export default ContentReader;

    