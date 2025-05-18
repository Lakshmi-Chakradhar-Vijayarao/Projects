
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react'; // Using Square for stop

// Define sections to read with their IDs and speakable text
const sectionsToRead = [
  { id: 'hero', speakableText: "Hero section: Introducing Chakradhar, a Software Engineer and ML Practitioner." },
  { id: 'about', speakableText: "About Chakradhar: A passionate software engineer and AI developer specializing in full-stack development and intelligent data processing." },
  { id: 'experience', speakableText: "Experience: Highlighting internships at NSIC Technical Services Centre and Zoho Corporation, focusing on e-commerce, API optimization, and real-time communication." },
  { id: 'projects', speakableText: "Projects: Showcasing impactful work in AI-powered detection, search engines, facial recognition, and system schedulers." },
  { id: 'skills-section', speakableText: "Skills: Detailing Chakradhar's proficiency in programming languages, frameworks, data technologies, and development methodologies." },
  { id: 'education-section', speakableText: "Education: Master's from The University of Texas at Dallas and Bachelor's from R.M.K. Engineering College." },
  { id: 'certifications-section', speakableText: "Certifications: Including IBM DevOps, Microsoft Full-Stack, Meta Back-End, and AWS Cloud Practitioner." },
  { id: 'publication-section', speakableText: "Publication: Featuring work on Text Detection Based on Deep Learning presented at an IEEE conference." },
  { id: 'contact', speakableText: "Contact: How to get in touch with Chakradhar." }
];

const ContentReader: React.FC = () => {
  const [isReading, setIsReading] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const [speechSynthInstance, setSpeechSynthInstance] = useState<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynthInstance(window.speechSynthesis);
    }
    return () => {
      if (speechSynthInstance && speechSynthInstance.speaking) {
        speechSynthInstance.cancel();
      }
    };
  }, []); // speechSynthInstance is set once on mount

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Forward declaration for mutual recursion
  let playNextSectionCallback: (() => void) | undefined;

  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (!speechSynthInstance || !text) {
      setIsReading(false);
      return;
    }

    if (speechSynthInstance.speaking) {
      speechSynthInstance.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    utterance.onend = () => {
      utteranceRef.current = null;
      if (onEndCallback) {
        onEndCallback();
      } else {
        setIsReading(false);
      }
    };
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      utteranceRef.current = null;
      setIsReading(false);
    };
    
    const speakLogic = () => {
      if (utteranceRef.current === utterance && speechSynthInstance) {
         speechSynthInstance.speak(utterance);
      }
    };

    if (speechSynthInstance.getVoices().length > 0) {
        speakLogic();
    } else {
        speechSynthInstance.onvoiceschanged = () => {
            speechSynthInstance.onvoiceschanged = null; 
            speakLogic();
        };
        // Some browsers might still require an initial speak attempt to trigger onvoiceschanged.
        // However, to avoid potential double-speak or race conditions, we'll primarily rely on the event.
        // If issues persist with voices not loading, a direct speak() call here might be re-added carefully.
    }
  }, [speechSynthInstance]); // Depends only on speechSynthInstance (and setIsReading which is stable)

  const playNextSection = useCallback(() => {
    setCurrentSectionIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      if (newIndex < sectionsToRead.length) {
        const nextSection = sectionsToRead[newIndex];
        smoothScrollTo(nextSection.id);
        // Pass the stable playNextSection reference itself
        speakText(nextSection.speakableText, playNextSectionCallback);
        return newIndex;
      } else {
        speakText("This concludes the overview of Chakradhar's portfolio.", () => {
          setIsReading(false);
        });
        return 0; // Reset for next play
      }
    });
  }, [speakText, sectionsToRead, smoothScrollTo, setCurrentSectionIndex, setIsReading]);

  playNextSectionCallback = playNextSection; // Assign the memoized function

  const startReadingSequence = useCallback((startIndex: number) => {
    if (startIndex < sectionsToRead.length) {
      setIsReading(true);
      const section = sectionsToRead[startIndex];
      smoothScrollTo(section.id);
      // Pass the stable playNextSection reference
      speakText(section.speakableText, playNextSectionCallback);
    } else {
      setIsReading(false); // Should not happen if logic is correct
    }
  }, [setIsReading, sectionsToRead, smoothScrollTo, speakText, playNextSectionCallback]);


  const handlePlayPauseClick = useCallback(() => {
    if (!speechSynthInstance) return;

    if (isReading) {
      speechSynthInstance.cancel();
      if (utteranceRef.current) {
        utteranceRef.current.onend = null; 
      }
      setIsReading(false);
    } else {
      setIsReading(true);
      if (!hasSpokenWelcome) {
        speakText("Welcome. I will now briefly guide you through Chakradhar's portfolio sections.", () => {
          setHasSpokenWelcome(true);
          setCurrentSectionIndex(0); // Ensure we start from the first section after welcome
          // Use a timeout to allow state update for currentSectionIndex to settle before starting sequence.
          setTimeout(() => startReadingSequence(0), 100); 
        });
      } else {
        // If welcome already spoken, resume from currentSectionIndex
        startReadingSequence(currentSectionIndex);
      }
    }
  }, [isReading, speechSynthInstance, hasSpokenWelcome, currentSectionIndex, speakText, startReadingSequence, setHasSpokenWelcome, setCurrentSectionIndex]);
  
  if (typeof window === 'undefined' || !window.speechSynthesis || !speechSynthInstance) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handlePlayPauseClick}
      className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-background hover:bg-accent/10 transition-all hover:scale-110"
      aria-label={isReading ? 'Stop portfolio overview' : 'Play portfolio overview'}
    >
      {isReading ? <Square className="h-6 w-6 text-primary" /> : <Play className="h-6 w-6 text-primary" />}
    </Button>
  );
};

export default ContentReader;
