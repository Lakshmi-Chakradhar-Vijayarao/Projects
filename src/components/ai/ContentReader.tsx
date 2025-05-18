
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

interface SectionToRead {
  id: string;
  speakableText: string;
  isSpecial?: boolean;
}

// Ensure section IDs match actual IDs on your page.
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

    // Cleanup function: stop speech and clear refs if component unmounts
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
      setIsReading(false); // Ensure correct state if queue empty or should not be reading
      return;
    }

    const section = sectionQueueRef.current.shift();
    if (!section) { // Should be caught by length === 0, but good guard
        setIsReading(false);
        return;
    }

    if (!section.isSpecial) {
      smoothScrollTo(section.id);
    }
    
    const utterance = new SpeechSynthesisUtterance(section.speakableText);
    currentUtteranceRef.current = utterance;

    utterance.onend = () => {
      if (currentUtteranceRef.current === utterance) { // Process only if it's the current utterance
        processSpeechQueue(); // Process next item in queue
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error;
      }
      console.error('SpeechSynthesisUtterance.onerror for text:', `"${section.speakableText}"`, 'Error details:', errorDetails, 'Full event object:', event);
      
      if (currentUtteranceRef.current === utterance) {
        currentUtteranceRef.current = null;
      }
      setIsReading(false);
      sectionQueueRef.current = []; // Clear queue on error
    };
    
    const attemptToSpeak = () => {
        if (synthRef.current) {
            synthRef.current.speak(utterance);
        }
    };

    // Simplified voice loading: try to speak. If voices aren't ready, it might use default or queue.
    // More complex voice selection/waiting can be added if needed but increases complexity.
    if (synthRef.current) {
        if (synthRef.current.getVoices().length > 0) {
            attemptToSpeak();
        } else {
            // Fallback if voices not immediately available
            const voiceChangeHandler = () => {
                if(synthRef.current) synthRef.current.onvoiceschanged = null;
                attemptToSpeak();
            };
            synthRef.current.onvoiceschanged = voiceChangeHandler;
            // Some browsers might still not fire onvoiceschanged quickly or at all
            // so as a fallback, try speaking after a short delay
            setTimeout(() => {
                 if (synthRef.current && synthRef.current.onvoiceschanged === voiceChangeHandler) {
                    // if handler hasn't fired and been cleared, try to speak
                    synthRef.current.onvoiceschanged = null;
                    attemptToSpeak();
                 } else if (synthRef.current && !synthRef.current.onvoiceschanged) {
                    // Handler already fired and cleared, or was never set (e.g. voices loaded fast)
                    // We might have already spoken, or if not, speak now.
                    // This part is tricky to make idempotent without extra flags per utterance call.
                    // The primary speak is above. This timeout is a fallback.
                    if (!synthRef.current.speaking && currentUtteranceRef.current === utterance) {
                        // attemptToSpeak(); // Can lead to double speak, be cautious
                    }
                 }
            }, 250); // Small delay
        }
    } else {
        setIsReading(false); // Synth not available
    }

  }, [isReading, smoothScrollTo, setIsReading]); // Added setIsReading as it's called


  // Effect to manage starting and stopping the speech queue
  useEffect(() => {
    if (isReading && synthRef.current) {
      // If we intend to read and synth is ready
      if (sectionQueueRef.current.length > 0 && !synthRef.current.speaking) {
        // And there are items in queue, and synth isn't already speaking
        processSpeechQueue();
      }
    } else if (!isReading && synthRef.current) {
      // If we intend to stop reading (isReading is false)
      synthRef.current.cancel();
      sectionQueueRef.current = []; // Clear queue
      if (currentUtteranceRef.current) { // Clean up handlers of any potentially stuck utterance
        currentUtteranceRef.current.onend = null;
        currentUtteranceRef.current.onerror = null;
        // currentUtteranceRef.current = null; // Do not nullify here, let processSpeechQueue handle if queue becomes empty
      }
    }
  }, [isReading, processSpeechQueue]); // processSpeechQueue is a dependency

  const handleToggleRead = () => {
    if (!isMounted || !synthRef.current) return;

    const nextIsReadingState = !isReading;

    if (nextIsReadingState) {
      // ----- STARTING -----
      sectionQueueRef.current = [...sectionsToReadData]; // Populate fresh queue
      setIsReading(true); // This will trigger the useEffect above to start processSpeechQueue
    } else {
      // ----- STOPPING -----
      setIsReading(false); // This will trigger the useEffect above to cancel/cleanup
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

