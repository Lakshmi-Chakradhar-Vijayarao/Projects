
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Volume2, VolumeX } from 'lucide-react';

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
    // Cleanup on unmount
    return () => {
      if (speechSynthInstance && speechSynthInstance.speaking) {
        speechSynthInstance.cancel();
      }
    };
  }, [speechSynthInstance]); // Rerun if speechSynthInstance changes (though it shouldn't after init)

  const smoothScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (!speechSynthInstance || !text) {
      setIsReading(false);
      return;
    }

    if (speechSynthInstance.speaking) {
      speechSynthInstance.cancel(); // Cancel any ongoing speech
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Store reference to manage it

    utterance.onend = () => {
      utteranceRef.current = null;
      if (onEndCallback) {
        onEndCallback();
      } else {
        setIsReading(false); // Default behavior if no specific callback
      }
    };
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      utteranceRef.current = null;
      setIsReading(false);
    };
    
    // Ensure voices are loaded, or use a timeout fallback
    const voices = speechSynthInstance.getVoices();
    if (voices.length > 0) {
      // You could set a preferred voice here if desired
      // utterance.voice = voices.find(voice => voice.name === 'Google UK English Female');
      speechSynthInstance.speak(utterance);
    } else {
       // Fallback if voices not immediately ready
      speechSynthInstance.onvoiceschanged = () => {
        if(!speechSynthInstance.speaking && utteranceRef.current === utterance){ 
             speechSynthInstance.speak(utterance);
        }
        speechSynthInstance.onvoiceschanged = null; // Remove listener
      };
      // Attempt to speak anyway
       speechSynthInstance.speak(utterance);
    }
  }, [speechSynthInstance]);

  const playNextSection = useCallback(() => {
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex < sectionsToRead.length) {
      setCurrentSectionIndex(nextIndex);
      const section = sectionsToRead[nextIndex];
      smoothScrollTo(section.id);
      speakText(section.speakableText, playNextSection);
    } else {
      // All sections read
      speakText("This concludes the overview of Chakradhar's portfolio.", () => {
        setIsReading(false);
        setCurrentSectionIndex(0); // Reset for next play
        setHasSpokenWelcome(true); // Keep welcome spoken
      });
    }
  }, [currentSectionIndex, speakText]);

  const startReadingSequence = useCallback(() => {
    setIsReading(true);
    const section = sectionsToRead[currentSectionIndex];
    smoothScrollTo(section.id);
    speakText(section.speakableText, playNextSection);
  }, [currentSectionIndex, speakText, playNextSection]);

  const handlePlayPauseClick = useCallback(() => {
    if (!speechSynthInstance) return;

    if (isReading) {
      speechSynthInstance.cancel();
      if (utteranceRef.current) {
          utteranceRef.current.onend = null; // Prevent onend from firing if manually stopped
      }
      setIsReading(false);
      // currentSectionIndex remains, so user can resume from this section
    } else {
      // Start or resume reading
      setIsReading(true);
      if (!hasSpokenWelcome) {
        speakText("Welcome. I will now briefly guide you through Chakradhar's portfolio sections.", () => {
          setHasSpokenWelcome(true);
          // Reset to first section if starting fresh after welcome
          if(currentSectionIndex !== 0) setCurrentSectionIndex(0); 
          // Use a slight delay to ensure state update before starting sequence
          setTimeout(() => startReadingSequence(), 100); 
        });
      } else {
        startReadingSequence();
      }
    }
  }, [isReading, speechSynthInstance, hasSpokenWelcome, currentSectionIndex, speakText, startReadingSequence]);
  
  if (typeof window === 'undefined' || !window.speechSynthesis || !speechSynthInstance) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handlePlayPauseClick}
      className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-background hover:bg-accent/10 transition-all hover:scale-110"
      aria-label={isReading ? 'Stop reading portfolio overview' : 'Play portfolio overview'}
    >
      {isReading ? <Square className="h-6 w-6 text-primary" /> : <Play className="h-6 w-6 text-primary" />}
    </Button>
  );
};

export default ContentReader;
