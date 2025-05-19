
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Icon } from 'lucide-react';

interface SectionToRead {
  id: string;
  speakableText: string;
  isSpecial?: boolean; // e.g., for welcome/outro that don't scroll
  outroMessage?: string;
}

// This data will be driven by IntegratedAssistantController's script in a real scenario
// For now, using the detailed script structure for Chakradhar
const sectionsToReadData: SectionToRead[] = [
  // Welcome message is now handled by InteractiveChatbot via IntegratedAssistantController
  { id: 'about', speakableText: "About Chakradhar: He's a passionate software engineer and AI developer specializing in full-stack development and intelligent data processing." },
  { id: 'experience', speakableText: "Experience: Highlighting internships at NSIC Technical Services Centre and Zoho Corporation, focusing on e-commerce, API optimization, and real-time communication." },
  { id: 'projects', speakableText: "Projects: Showcasing impactful work in AI-powered detection, search engines, facial recognition, and system schedulers." },
  { id: 'skills-section', speakableText: "Skills: Detailing Chakradhar's proficiency in programming languages, frameworks, data technologies, and development methodologies." },
  { id: 'education-section', speakableText: "Education: Master's from The University of Texas at Dallas and Bachelor's from R.M.K. Engineering College." },
  { id: 'certifications-section', speakableText: "Certifications: Including IBM DevOps, Microsoft Full-Stack, Meta Back-End, and AWS Certified Cloud Practitioner." },
  { id: 'publication-section', speakableText: "Publication: Featuring Chakradhar's work on Text Detection Based on Deep Learning presented at an IEEE conference." },
  { id: 'contact', speakableText: "This concludes the overview of Chakradhar's portfolio. You can use the chat to ask specific questions or download his resume.", isSpecial: true },
];


interface ContentReaderProps {
  startTour: boolean;
  onTourComplete: () => void;
  stopTourSignal: boolean;
}

const ContentReader: React.FC<ContentReaderProps> = ({ startTour, onTourComplete, stopTourSignal }) => {
  const [isReading, setIsReading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sectionQueueRef = useRef<SectionToRead[]>([]);
  const currentSectionIndexRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      console.log("ContentReader: Speech synthesis initialized.");
    } else {
      console.warn("ContentReader: Speech synthesis not supported or not available.");
    }
    return () => {
      console.log("ContentReader: Unmounting. Cancelling speech.");
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current.onend = null;
        currentUtteranceRef.current.onerror = null;
      }
    };
  }, []);

  const smoothScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`ContentReader: Scrolling to section: ${id}`);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`ContentReader: Element with id ${id} not found for scrolling.`);
    }
  }, []);

  const speakText = useCallback((textToSpeak: string, onEndCallback: () => void) => {
    if (!isMounted || !synthRef.current) {
      console.warn("ContentReader: SpeakText called before synth is ready or component mounted.");
      if (isReading) setIsReading(false); // Stop if we can't speak
      return;
    }
    console.log(`ContentReader: Attempting to speak: "${textToSpeak}"`);

    // Cancel any ongoing speech *before* creating a new utterance
    // This is important if a new speak command comes while previous is still finishing.
    if (synthRef.current.speaking || synthRef.current.pending) {
        console.log("ContentReader: Cancelling existing speech before speaking new text.");
        synthRef.current.cancel(); 
        // It's crucial that onend/onerror of the *cancelled* utterance don't fire or are handled.
        // Setting them null on the ref helps, but `cancel()` should also prevent `onend`.
        if (currentUtteranceRef.current) {
            currentUtteranceRef.current.onend = null;
            currentUtteranceRef.current.onerror = null;
        }
    }


    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    currentUtteranceRef.current = utterance;

    utterance.onend = () => {
      console.log(`ContentReader: Speech ended for: "${textToSpeak}"`);
      if (currentUtteranceRef.current === utterance) { // Ensure it's the current one
        currentUtteranceRef.current.onend = null; // Clean up self
        currentUtteranceRef.current.onerror = null; // Clean up self
        currentUtteranceRef.current = null;
        onEndCallback();
      } else {
        console.log("ContentReader: onend called for a stale utterance.");
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error;
      }
      console.error('ContentReader: SpeechSynthesisUtterance.onerror for text:', `"${textToSpeak}"`, 'Error details:', errorDetails, 'Full event object:', event);
      if (currentUtteranceRef.current === utterance) {
        currentUtteranceRef.current.onend = null; // Clean up self
        currentUtteranceRef.current.onerror = null; // Clean up self
        currentUtteranceRef.current = null;
      }
      setIsReading(false); // Stop reading on error
    };
    
    // Try to speak directly
    // Browsers usually queue if voices are loading, or use a default.
    // The 'voiceschanged' event can be complex to manage reliably across browsers for simple sequential speech.
    if (synthRef.current.getVoices().length > 0) {
        console.log("ContentReader: Voices available, speaking directly.");
        synthRef.current.speak(utterance);
    } else {
        console.log("ContentReader: Voices not immediately available, attempting to speak anyway (browser might queue or use default).");
        // Attempt to speak; if it fails, the onerror should catch it.
        // For more robustness, one might re-add an onvoiceschanged listener here,
        // but it adds complexity that can lead to loops if not handled perfectly.
        const voiceLoadTimeout = setTimeout(() => {
            if (synthRef.current && !utterance.onend && !utterance.onerror) { // Check if it hasn't already started/errored
                 console.log("ContentReader: Voice load timeout, trying to speak again if synth is idle.");
                 if(!synthRef.current.speaking && !synthRef.current.pending){
                    synthRef.current.speak(utterance);
                 } else {
                    console.log("ContentReader: Synth busy after voice load timeout.");
                 }
            }
        }, 250); // Short timeout as a fallback
        synthRef.current.speak(utterance); // Try to speak immediately
    }

  }, [isMounted, isReading, setIsReading]); // Added isReading and setIsReading

  const processSpeechQueue = useCallback(() => {
    console.log(`ContentReader: processSpeechQueue called. isReading: ${isReading}, queue length: ${sectionQueueRef.current.length}`);
    if (!isReading || sectionQueueRef.current.length === 0) {
      console.log("ContentReader: Queue empty or not reading. Tour complete or stopped.");
      setIsReading(false);
      if (sectionQueueRef.current.length === 0 && isReading) { // Check isReading one last time
        onTourComplete();
      }
      return;
    }

    const section = sectionQueueRef.current.shift();
    if (!section) {
      console.log("ContentReader: No section found in queue, ending tour.");
      setIsReading(false);
      onTourComplete();
      return;
    }

    currentSectionIndexRef.current = sectionsToReadData.findIndex(s => s.id === section.id);

    if (!section.isSpecial) {
      smoothScrollTo(section.id);
    }

    speakText(section.speakableText, processSpeechQueue); // Pass processSpeechQueue as the onEndCallback

  }, [isReading, setIsReading, sectionsToReadData, smoothScrollTo, speakText, onTourComplete]);


  const startReadingSequence = useCallback(() => {
    console.log("ContentReader: startReadingSequence called.");
    if (!isMounted || !synthRef.current) {
      console.warn("ContentReader: startReadingSequence called before component mounted or synth ready.");
      return;
    }
    setIsReading(true);
    sectionQueueRef.current = [...sectionsToReadData]; // Reset queue
    currentSectionIndexRef.current = 0;
    // The useEffect listening to `isReading` will call processSpeechQueue
  }, [isMounted, setIsReading, sectionsToReadData]);

  useEffect(() => {
    console.log(`ContentReader: startTour prop changed to: ${startTour}`);
    if (startTour && !isReading && isMounted) {
      console.log("ContentReader: Start tour signal received, calling startReadingSequence.");
      startReadingSequence();
    } else if (!startTour && isReading && isMounted) {
      // This case might be for externally stopping, but stopTourSignal is more direct.
      console.log("ContentReader: startTour became false while reading, potential external stop.");
    }
  }, [startTour, isReading, isMounted, startReadingSequence]);
  
  useEffect(() => {
    if (isReading && sectionQueueRef.current.length > 0 && synthRef.current && !synthRef.current.speaking && !synthRef.current.pending) {
      // This effect kicks off processing if `isReading` becomes true and the queue isn't empty.
      console.log("ContentReader: isReading is true, queue has items, synth is idle. Processing queue.");
      processSpeechQueue();
    }
  }, [isReading, processSpeechQueue]); // Removed sectionQueueRef.current from deps as it's a ref

  useEffect(() => {
    console.log(`ContentReader: stopTourSignal changed to: ${stopTourSignal}`);
    if (stopTourSignal && isReading && isMounted) {
      console.log("ContentReader: Stop tour signal received. Stopping speech.");
      if (synthRef.current) {
        // Detach handlers from the current utterance *before* cancelling
        if (currentUtteranceRef.current) {
            currentUtteranceRef.current.onend = null;
            currentUtteranceRef.current.onerror = null;
        }
        synthRef.current.cancel();
      }
      currentUtteranceRef.current = null;
      sectionQueueRef.current = [];
      setIsReading(false);
      // onTourComplete is NOT called here as it's an interruption
    }
  }, [stopTourSignal, isReading, isMounted, setIsReading]);

  // This component is now fully controlled by IntegratedAssistantController for its UI.
  // The play/stop button will be managed there.
  return null;
};

export default ContentReader;
