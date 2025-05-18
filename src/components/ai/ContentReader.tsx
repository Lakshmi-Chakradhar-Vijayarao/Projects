
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

interface SectionToRead {
  id: string;
  speakableText: string;
}

const sectionsToRead: SectionToRead[] = [
  { id: 'hero', speakableText: "Hero section: Introducing Chakradhar, a Software Engineer and ML Practitioner." },
  { id: 'about', speakableText: "About Chakradhar: A passionate software engineer and AI developer specializing in full-stack development and intelligent data processing." },
  { id: 'experience', speakableText: "Experience: Highlighting internships at NSIC Technical Services Centre and Zoho Corporation, focusing on e-commerce, API optimization, and real-time communication." },
  { id: 'projects', speakableText: "Projects: Showcasing impactful work in AI-powered detection, search engines, facial recognition, and system schedulers." },
  { id: 'skills-section', speakableText: "Skills: Detailing Chakradhar's proficiency in programming languages, frameworks, data technologies, and development methodologies." },
  { id: 'education-section', speakableText: "Education: Master's from The University of Texas at Dallas and Bachelor's from R.M.K. Engineering College." },
  { id: 'certifications-section', speakableText: "Certifications: Including IBM DevOps, Microsoft Full-Stack, Meta Back-End, and AWS Certified Cloud Practitioner." },
  { id: 'publication-section', speakableText: "Publication: Featuring work on Text Detection Based on Deep Learning presented at an IEEE conference." },
  { id: 'contact', speakableText: "Contact: How to get in touch with Chakradhar." }
];

const ContentReader: React.FC = () => {
  const [isReading, setIsReading] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const [speechSynthInstance, setSpeechSynthInstance] = useState<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis instance
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynthInstance(window.speechSynthesis);
    }
    // Cleanup
    return () => {
      if (speechSynthInstance && speechSynthInstance.speaking) {
        speechSynthInstance.cancel();
      }
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
    };
  }, []); // speechSynthInstance is set once on mount

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Forward declaration for mutually recursive callbacks
  let playNextSectionCallbackRef: React.MutableRefObject<(() => void) | null> = useRef(null);

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
    
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      // Enhanced error logging
      let errorDetails = 'Unknown error';
      if (event.error) { // event.error is a standard property for SpeechSynthesisErrorEvent
        errorDetails = event.error;
      }
      console.error('SpeechSynthesisUtterance.onerror for text:', `"${text}"`, 'Error details:', errorDetails, 'Full event object:', event);
      utteranceRef.current = null;
      setIsReading(false);
    };
    
    const speakLogic = () => {
      if (utteranceRef.current === utterance && speechSynthInstance) {
         speechSynthInstance.speak(utterance);
      }
    };

    // Ensure voices are loaded before speaking
    if (speechSynthInstance.getVoices().length > 0) {
        speakLogic();
    } else {
        speechSynthInstance.onvoiceschanged = () => {
            speechSynthInstance.onvoiceschanged = null; // Clear the handler
            speakLogic();
        };
        // Some browsers might need an initial speak to trigger voice loading
        if (speechSynthInstance.getVoices().length === 0 && !speechSynthInstance.speaking) {
            // Speaking an empty string can sometimes kickstart voice loading if onvoiceschanged doesn't fire.
            // This should ideally be handled carefully, but it's a common workaround.
            try {
                speechSynthInstance.speak(new SpeechSynthesisUtterance("")); 
            } catch (e) {
                console.warn("Empty utterance failed, possibly normal if voices are truly unavailable yet.", e);
            }
        }
    }
  }, [speechSynthInstance]);


  const playNextSection = useCallback(() => {
    setCurrentSectionIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      if (newIndex < sectionsToRead.length) {
        const nextSection = sectionsToRead[newIndex];
        smoothScrollTo(nextSection.id);
        if (playNextSectionCallbackRef.current) {
          speakText(nextSection.speakableText, playNextSectionCallbackRef.current);
        }
        return newIndex;
      } else {
        speakText("This concludes the overview of Chakradhar's portfolio.", () => {
          setIsReading(false);
        });
        return 0; // Reset for next play
      }
    });
  }, [speakText, sectionsToRead, smoothScrollTo, setCurrentSectionIndex, setIsReading]); // playNextSectionCallbackRef removed as it's self-referential indirectly

  // Assign the memoized function to the ref *after* playNextSection is defined.
  useEffect(() => {
    playNextSectionCallbackRef.current = playNextSection;
  }, [playNextSection]);


  const startReadingSequence = useCallback((startIndex: number) => {
    if (startIndex < sectionsToRead.length) {
      setIsReading(true);
      const section = sectionsToRead[startIndex];
      smoothScrollTo(section.id);
      if (playNextSectionCallbackRef.current) {
        speakText(section.speakableText, playNextSectionCallbackRef.current);
      }
    } else {
      setIsReading(false);
    }
  }, [setIsReading, sectionsToRead, smoothScrollTo, speakText]);


  const handlePlayPauseClick = useCallback(() => {
    if (!speechSynthInstance) return;

    if (isReading) {
      speechSynthInstance.cancel(); // Stop any current speech
      if (utteranceRef.current) { // Clean up listeners for the cancelled utterance
        utteranceRef.current.onend = null; 
        utteranceRef.current.onerror = null;
      }
      setIsReading(false);
    } else {
      setIsReading(true);
      if (!hasSpokenWelcome) {
        speakText("Welcome. I will now briefly guide you through Chakradhar's portfolio sections.", () => {
          setHasSpokenWelcome(true);
          // Ensure currentSectionIndex is 0 before starting the sequence after welcome
          setCurrentSectionIndex(0); 
          // Use a timeout to ensure state update for currentSectionIndex is processed
          setTimeout(() => startReadingSequence(0), 50); 
        });
      } else {
        // If welcome already spoken, resume from currentSectionIndex
        startReadingSequence(currentSectionIndex);
      }
    }
  }, [isReading, speechSynthInstance, hasSpokenWelcome, currentSectionIndex, speakText, startReadingSequence, setHasSpokenWelcome, setCurrentSectionIndex]);
  
  // Render null on server or if speech synthesis is not supported/initialized
  if (!speechSynthInstance) {
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

    