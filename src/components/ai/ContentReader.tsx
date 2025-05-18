
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

const ContentReader: React.FC = () => {
  const [isReading, setIsReading] = useState(false);
  const [hasSpokenIntro, setHasSpokenIntro] = useState(false);
  const [speechSynthInstance, setSpeechSynthInstance] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech synthesis instance only on the client-side after mount
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynthInstance(window.speechSynthesis);
    }

    // Cleanup function:
    // This will capture the value of speechSynthInstance at the time the effect runs.
    // Since this effect runs only once on mount, it captures the instance if set, or null.
    return () => {
      // Access window.speechSynthesis directly for cleanup if instance wasn't set or is stale
      const currentSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;
      if (currentSynth && currentSynth.speaking) {
        currentSynth.cancel();
      }
    };
  }, []); // Empty dependency array: run only on mount and clean up on unmount

  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (!speechSynthInstance || !text) {
      if (!speechSynthInstance) console.warn("Speech synthesis not initialized or not available for speakText.");
      setIsReading(false); // Ensure isReading is false if we can't speak
      return;
    }

    if (speechSynthInstance.speaking) {
      speechSynthInstance.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setIsReading(false);
      if (onEndCallback) {
        onEndCallback();
      }
    };
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsReading(false);
    };
    
    // Check if voices are loaded - sometimes helps with immediate speak issues on some browsers
    const voices = speechSynthInstance.getVoices();
    if (voices.length > 0) {
        speechSynthInstance.speak(utterance);
        setIsReading(true);
    } else {
        // Fallback if voices are not immediately available (can happen on some browsers)
        speechSynthInstance.onvoiceschanged = () => {
            if(!speechSynthInstance.speaking && !isReading){ // Check if not already started from another trigger
                speechSynthInstance.speak(utterance);
                setIsReading(true);
            }
            speechSynthInstance.onvoiceschanged = null; // Remove listener
        };
        // Attempt to speak anyway, some browsers might handle it
        speechSynthInstance.speak(utterance);
        setIsReading(true);
    }

  }, [speechSynthInstance, isReading]); // Added isReading to dependencies of speakText to avoid stale closures if it's rapidly called

  const handleReadContent = useCallback(async () => {
    if (!speechSynthInstance) {
      console.warn('Speech synthesis not available for handleReadContent.');
      return;
    }

    if (isReading) {
      speechSynthInstance.cancel();
      setIsReading(false);
      return;
    }

    const speakAboutMe = () => {
      const aboutMeSection = document.getElementById('about');
      if (aboutMeSection) {
        const paragraph = aboutMeSection.querySelector('p'); 
        const contentToRead = paragraph?.textContent || aboutMeSection.textContent;

        if (contentToRead && contentToRead.trim()) {
          smoothScrollTo('about');
          speakText(contentToRead.trim());
        } else {
          console.warn('No content found in About Me section to read.');
          setIsReading(false);
        }
      } else {
        console.warn('About Me section not found for reading.');
        setIsReading(false);
      }
    };

    if (!hasSpokenIntro) {
      speakText("Welcome. I will now provide an audio overview of Chakradhar's portfolio.", () => {
        setHasSpokenIntro(true);
        setTimeout(speakAboutMe, 500); 
      });
    } else {
      speakAboutMe();
    }
  }, [isReading, hasSpokenIntro, speechSynthInstance, speakText, setHasSpokenIntro]);

  const smoothScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (typeof window === 'undefined' || !window.speechSynthesis || !speechSynthInstance) {
    // Do not render the button if speech synthesis is not supported or not yet initialized.
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleReadContent}
      className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg bg-background hover:bg-accent/10"
      aria-label={isReading ? 'Stop reading' : 'Read page content'}
    >
      {isReading ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
    </Button>
  );
};

export default ContentReader;
