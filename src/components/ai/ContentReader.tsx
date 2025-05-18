'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

interface SectionToRead {
  id: string;
  speakableText: string;
  isSpecial?: boolean; // To avoid scrolling for virtual sections like intro/outro
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
  
  // This ref helps the onend callback access the current isReading state
  const isReadingRef = useRef(isReading);
  useEffect(() => {
    isReadingRef.current = isReading;
  }, [isReading]);

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
        currentUtteranceRef.current = null;
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
    if (!isReadingRef.current || sectionQueueRef.current.length === 0 || !synthRef.current) {
      setIsReading(false); // Ensure state is updated
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current.onend = null; // Clean up just in case
        currentUtteranceRef.current.onerror = null;
        currentUtteranceRef.current = null;
      }
      return;
    }

    const section = sectionQueueRef.current.shift(); // Get and remove the next section
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
      if (currentUtteranceRef.current === utterance) { // Ensure it's this utterance
        currentUtteranceRef.current = null;
        processSpeechQueue(); // Process next item in queue
      }
    };

    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror:', event.error, 'for text:', section.speakableText);
      if (currentUtteranceRef.current === utterance) {
        currentUtteranceRef.current = null;
      }
      setIsReading(false);
      sectionQueueRef.current = []; // Clear queue on error
    };
    
    // Simple voice loading check
    const speakNow = () => {
      if (synthRef.current) {
        // synthRef.current.cancel(); // Cancel previous before speaking new one.
                                   // This is often the source of "interrupted" or complex issues.
                                   // The queue system should prevent overlaps naturally.
        synthRef.current.speak(utterance);
      }
    };

    if (synthRef.current.getVoices().length > 0) {
      speakNow();
    } else {
      // Wait for voices to be loaded
      synthRef.current.onvoiceschanged = () => {
        if (synthRef.current) synthRef.current.onvoiceschanged = null; // Remove listener
        speakNow();
      };
      // Fallback if onvoiceschanged doesn't fire quickly or voices were already loading
      if (synthRef.current.getVoices().length > 0) {
         if (synthRef.current) synthRef.current.onvoiceschanged = null;
         speakNow();
      }
    }
  }, [smoothScrollTo]);

  const handleToggleRead = () => {
    if (!synthRef.current || !isMounted) return;

    const nextIsReading = !isReading;
    setIsReading(nextIsReading); // Update React state

    if (nextIsReading) {
      // Start reading: populate the queue and process the first item
      sectionQueueRef.current = [...sectionsToReadData]; // Fresh queue
      processSpeechQueue();
    } else {
      // Stop reading: clear the queue and cancel any current speech
      sectionQueueRef.current = [];
      synthRef.current.cancel();
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current.onend = null; // Important to prevent onend from firing after manual stop
        currentUtteranceRef.current.onerror = null;
        currentUtteranceRef.current = null;
      }
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
