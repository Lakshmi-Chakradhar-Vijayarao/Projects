
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

interface SectionToRead {
  id: string;
  speakableText: string;
  isSpecial?: boolean; // For sections like intro/outro that don't scroll
}

const sectionsToReadData: SectionToRead[] = [
  { id: 'welcome', speakableText: "Welcome. I will now briefly guide you through Chakradhar's portfolio sections.", isSpecial: true },
  { id: 'about', speakableText: "About Chakradhar: A passionate software engineer and AI developer specializing in full-stack development and intelligent data processing." },
  { id: 'experience', speakableText: "Experience: Highlighting internships at NSIC Technical Services Centre and Zoho Corporation, focusing on e-commerce, API optimization, and real-time communication." },
  { id: 'projects', speakableText: "Projects: Showcasing impactful work in AI-powered detection, search engines, facial recognition, and system schedulers." },
  { id: 'skills-section', speakableText: "Skills: Detailing Chakradhar's proficiency in programming languages, frameworks, data technologies, and development methodologies." },
  { id: 'education-section', speakableText: "Education: Master's from The University of Texas at Dallas and Bachelor's from R.M.K. Engineering College." },
  { id: 'certifications-section', speakableText: "Certifications: Including IBM DevOps, Microsoft Full-Stack, Meta Back-End, and AWS Certified Cloud Practitioner." },
  { id: 'publication-section', speakableText: "Publication: Featuring work on Text Detection Based on Deep Learning presented at an IEEE conference." },
  { id: 'outro', speakableText: "This concludes the overview of Chakradhar's portfolio. Thank you for listening.", isSpecial: true },
];


const ContentReader: React.FC = () => {
  const [isReading, setIsReading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sectionQueueRef = useRef<SectionToRead[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current.onend = null;
        currentUtteranceRef.current.onerror = null;
      }
      currentUtteranceRef.current = null;
      sectionQueueRef.current = [];
    };
  }, []);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const processSpeechQueue = useCallback(() => {
    if (!isReading || sectionQueueRef.current.length === 0 || !synthRef.current) {
      setIsReading(false);
      return;
    }

    const section = sectionQueueRef.current.shift();
    if (!section) {
        setIsReading(false);
        return;
    }

    if (!section.isSpecial) {
      smoothScrollTo(section.id);
    }
    
    const utterance = new SpeechSynthesisUtterance(section.speakableText);
    currentUtteranceRef.current = utterance;

    utterance.onend = () => {
      if (currentUtteranceRef.current === utterance) {
        currentUtteranceRef.current.onend = null; // Clean up current handler
        currentUtteranceRef.current.onerror = null;
        processSpeechQueue(); 
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error;
      }
      console.error('SpeechSynthesisUtterance.onerror for text:', `"${section.speakableText}"`, 'Error details:', errorDetails, 'Full event object:', event);
      
      if (currentUtteranceRef.current === utterance) {
        currentUtteranceRef.current.onend = null;
        currentUtteranceRef.current.onerror = null;
        currentUtteranceRef.current = null;
      }
      setIsReading(false);
      sectionQueueRef.current = [];
    };
    
    const attemptToSpeak = () => {
        if (synthRef.current && currentUtteranceRef.current === utterance) { // Ensure it's still the current intended utterance
            synthRef.current.speak(utterance);
        }
    };

    if (synthRef.current) {
        if (synthRef.current.getVoices().length > 0) {
            attemptToSpeak();
        } else {
            const voiceChangeHandler = () => {
                if(synthRef.current) synthRef.current.onvoiceschanged = null;
                attemptToSpeak();
            };
            synthRef.current.onvoiceschanged = voiceChangeHandler;
            setTimeout(() => {
                 if (synthRef.current && synthRef.current.onvoiceschanged === voiceChangeHandler) {
                    synthRef.current.onvoiceschanged = null;
                    attemptToSpeak();
                 }
            }, 250);
        }
    } else {
        setIsReading(false);
    }
  }, [isReading, smoothScrollTo, setIsReading]); // Added setIsReading

  useEffect(() => {
    if (isReading && synthRef.current) {
      if (sectionQueueRef.current.length > 0 && !synthRef.current.speaking && !currentUtteranceRef.current) {
         processSpeechQueue();
      }
    } else if (!isReading && synthRef.current) {
      synthRef.current.cancel();
      sectionQueueRef.current = []; 
      if (currentUtteranceRef.current) { 
        currentUtteranceRef.current.onend = null;
        currentUtteranceRef.current.onerror = null;
        // currentUtteranceRef.current = null; // Let processSpeechQueue handle this when queue is empty naturally
      }
    }
  }, [isReading, processSpeechQueue]);

  const handleToggleRead = () => {
    if (!isMounted || !synthRef.current) return;

    const nextIsReadingState = !isReading;
    setIsReading(nextIsReadingState);

    if (nextIsReadingState) {
      sectionQueueRef.current = [...sectionsToReadData]; 
      // processSpeechQueue will be called by the useEffect watching isReading
    } else {
      // Stopping logic is handled by the useEffect watching isReading
      if (synthRef.current.speaking) {
        synthRef.current.cancel(); // Ensure immediate stop
      }
       if (currentUtteranceRef.current) {
        currentUtteranceRef.current.onend = null;
        currentUtteranceRef.current.onerror = null;
      }
      currentUtteranceRef.current = null;
      sectionQueueRef.current = [];
    }
  };

  if (!isMounted) {
    return null; 
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggleRead}
      className="fixed bottom-6 right-6 z-[1000] rounded-full w-14 h-14 shadow-lg bg-background hover:bg-accent/10 transition-all hover:scale-110"
      aria-label={isReading ? 'Stop portfolio overview' : 'Play portfolio overview'}
    >
      {isReading ? <Square className="h-6 w-6 text-primary" /> : <Play className="h-6 w-6 text-primary" />}
    </Button>
  );
};

export default ContentReader;
