
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
  
  // Ref to hold the latest version of playNextSection callback
  const playNextSectionCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let synth: SpeechSynthesis | null = null;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synth = window.speechSynthesis;
      setSpeechSynthInstance(synth);
    }

    return () => {
      if (synth && synth.speaking) {
        synth.cancel();
      }
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
    };
  }, []); // Runs once on mount, cleanup on unmount

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (!speechSynthInstance || !text) {
      setIsReading(false); // Ensure reading state is false if we can't speak
      if(onEndCallback) onEndCallback(); // Try to proceed if there's a callback
      return;
    }

    // Detach handlers from any previous utterance
    if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    utterance.onend = () => {
      if (utteranceRef.current === utterance) { // Check if this is still the active utterance
        utteranceRef.current = null; // Clear ref *before* callback
        if (onEndCallback) {
          onEndCallback();
        } else {
          setIsReading(false);
        }
      }
    };
    
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (utteranceRef.current === utterance) { // Check if this is still the active utterance
        let errorDetails = 'Unknown error';
        if (event.error) { errorDetails = event.error; }
        console.error('SpeechSynthesisUtterance.onerror for text:', `"${text}"`, 'Error details:', errorDetails, 'Full event object:', event);
        utteranceRef.current = null;
        setIsReading(false);
        // Optionally, could call onEndCallback here too to try to advance the tour
      }
    };
    
    const speakLogic = () => {
      if (speechSynthInstance && utteranceRef.current === utterance) { // Ensure utterance is still current
         speechSynthInstance.speak(utterance);
      }
    };

    if (speechSynthInstance.getVoices().length > 0) {
        speakLogic();
    } else {
        // Wait for voices to be loaded
        speechSynthInstance.onvoiceschanged = () => {
            speechSynthInstance.onvoiceschanged = null; 
            speakLogic();
        };
    }
  }, [speechSynthInstance, setIsReading]);


  const playNextSection = useCallback(() => {
    setCurrentSectionIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      if (newIndex < sectionsToRead.length) {
        const nextSection = sectionsToRead[newIndex];
        smoothScrollTo(nextSection.id);
        // Use the ref to call the latest speakText, ensuring the callback is also the latest playNextSection
        if (playNextSectionCallbackRef.current) {
             speakText(nextSection.speakableText, playNextSectionCallbackRef.current);
        }
        return newIndex;
      } else { // End of sections
        speakText("This concludes the overview of Chakradhar's portfolio.", () => {
          setIsReading(false); // Set isReading to false when the final message ends
        });
        return 0; // Reset index or handle end state
      }
    });
  }, [speakText, sectionsToRead, smoothScrollTo, setIsReading]); // Removed setCurrentSectionIndex as it's handled by functional update

  // Keep the ref updated with the latest version of playNextSection
  useEffect(() => {
    playNextSectionCallbackRef.current = playNextSection;
  }, [playNextSection]);


  const startReadingSequence = useCallback((startIndex: number) => {
    if (startIndex < sectionsToRead.length) {
      setIsReading(true);
      const section = sectionsToRead[startIndex];
      smoothScrollTo(section.id);
      // Use the ref for the callback here
      if (playNextSectionCallbackRef.current) {
         speakText(section.speakableText, playNextSectionCallbackRef.current);
      }
    } else {
      // This case should ideally be handled by playNextSection's end condition
      setIsReading(false); 
    }
  }, [setIsReading, sectionsToRead, smoothScrollTo, speakText]);

  const handlePlayPauseClick = useCallback(() => {
    if (!speechSynthInstance) return;

    if (isReading) { // If currently reading, stop it
      if (speechSynthInstance.speaking) {
        // Detach handlers *before* cancelling to prevent onend from firing and advancing
        if (utteranceRef.current) {
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
        }
        speechSynthInstance.cancel();
      }
      utteranceRef.current = null; // Clear the ref
      setIsReading(false);
    } else { // If not reading, start or resume
      setIsReading(true); // Set immediately for UI feedback
      if (!hasSpokenWelcome) {
        speakText("Welcome. I will now briefly guide you through Chakradhar's portfolio sections.", () => {
          setHasSpokenWelcome(true);
          setCurrentSectionIndex(0); 
          // Short delay to allow welcome message to finish before starting sequence
          setTimeout(() => startReadingSequence(0), 50); 
        });
      } else {
        // Resume: If already started, play from currentSectionIndex
        startReadingSequence(currentSectionIndex);
      }
    }
  }, [isReading, speechSynthInstance, hasSpokenWelcome, currentSectionIndex, speakText, startReadingSequence, setHasSpokenWelcome, setCurrentSectionIndex, setIsReading]);
  
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
