
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
      }
      utteranceRef.current = null;
    };
  }, []);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (!speechSynthInstance || !text) {
      setIsReading(false);
      if (onEndCallback) onEndCallback();
      return;
    }

    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    let spokenOrQueuedThisCall = false;

    utterance.onend = () => {
      // Make sure this specific utterance's handlers are cleared
      utterance.onend = null;
      utterance.onerror = null;

      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        if (onEndCallback) {
          onEndCallback();
        } else {
          setIsReading(false);
        }
      }
    };
    
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      utterance.onend = null;
      utterance.onerror = null;

      if (utteranceRef.current === utterance) {
        let errorDetails = 'Unknown error';
        if (event.error) { errorDetails = event.error; }
        console.error('SpeechSynthesisUtterance.onerror for text:', `"${text}"`, 'Error details:', errorDetails, 'Full event object:', event);
        utteranceRef.current = null;
        setIsReading(false);
        // Optionally call onEndCallback to try to advance if it's a recoverable error or we want to skip
        // if (onEndCallback) onEndCallback(); 
      }
    };
    
    const trySpeak = () => {
      if (spokenOrQueuedThisCall) return; // Prevent double speak for this instance of speakText call

      if (speechSynthInstance && utteranceRef.current === utterance) {
         speechSynthInstance.speak(utterance);
         spokenOrQueuedThisCall = true;
      } else if (speechSynthInstance && utteranceRef.current !== utterance) {
        // This means the utteranceRef was changed by a subsequent call to speakText
        // before this one (e.g. from onvoiceschanged) could speak.
        // This is okay, the newer one takes precedence.
      }
    };

    if (speechSynthInstance.getVoices().length > 0) {
        trySpeak();
    } else {
        const voiceChangeHandler = () => {
            if (speechSynthInstance) speechSynthInstance.onvoiceschanged = null;
            trySpeak();
        };
        speechSynthInstance.onvoiceschanged = voiceChangeHandler;
        // It's possible voices loaded between the .length check and setting the handler.
        // Check again. If already spoken by the main path, this won't do anything.
        if (speechSynthInstance.getVoices().length > 0) {
            trySpeak(); // This will be guarded by spokenOrQueuedThisCall
            if (spokenOrQueuedThisCall && speechSynthInstance) { // If spoken, clean up just in case
                speechSynthInstance.onvoiceschanged = null;
            }
        }
    }
  }, [speechSynthInstance, setIsReading]);


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
        return 0; 
      }
    });
  }, [speakText, sectionsToRead, smoothScrollTo, setIsReading, setCurrentSectionIndex]);

  useEffect(() => {
    playNextSectionCallbackRef.current = playNextSection;
  }, [playNextSection]);

  const startReadingSequence = useCallback((startIndex: number) => {
    if (!speechSynthInstance) {
        setIsReading(false);
        return;
    }
    if (startIndex < sectionsToRead.length) {
      setIsReading(true); // Set reading state true
      const section = sectionsToRead[startIndex];
      smoothScrollTo(section.id);
      if (playNextSectionCallbackRef.current) {
         speakText(section.speakableText, playNextSectionCallbackRef.current);
      }
    } else {
      setIsReading(false); 
    }
  }, [setIsReading, sectionsToRead, smoothScrollTo, speakText, speechSynthInstance]);

  const handlePlayPauseClick = useCallback(() => {
    if (!speechSynthInstance) return;

    if (isReading) {
      if (speechSynthInstance.speaking) {
        const activeUtterance = utteranceRef.current;
        // Nullify ref *before* cancel to prevent its onend from triggering next section
        utteranceRef.current = null; 
        if (activeUtterance) {
          activeUtterance.onend = null;
          activeUtterance.onerror = null;
        }
        speechSynthInstance.cancel();
      }
      setIsReading(false);
    } else {
      setIsReading(true); 
      if (!hasSpokenWelcome) {
        speakText("Welcome. I will now briefly guide you through Chakradhar's portfolio sections.", () => {
          setHasSpokenWelcome(true);
          setCurrentSectionIndex(0); 
          setTimeout(() => { // Short delay for welcome to finish before first section
            if (utteranceRef.current === null) { // Ensure not interrupted
                 startReadingSequence(0);
            }
          }, 50); 
        });
      } else {
        // If resuming, start from the currentSectionIndex
        // Ensure any previous utterance is cleared if we are explicitly restarting
        if (speechSynthInstance.speaking) speechSynthInstance.cancel();
        utteranceRef.current = null; // Clear ref before starting new sequence
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

