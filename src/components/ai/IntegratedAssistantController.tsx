
"use client";
import React, { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
// import ContentReader from '@/components/ai/ContentReader'; // Temporarily removed
// import SimpleAvatarDisplay from '@/components/ai/SimpleAvatarDisplay'; // Temporarily removed
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BotMessageSquare, Play, Send, Loader2, ArrowRight, Newspaper, Award, GraduationCap, Brain, Briefcase, User, HomeIcon, Phone, FileText, Github, Linkedin, Mail } from 'lucide-react';

// Helper function to scroll to a section
const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    console.log(`IntegratedAssistantController: Scrolling to ${elementId}`);
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    console.warn(`IntegratedAssistantController: Element with ID ${elementId} not found for scrolling.`);
  }
};

type TourStepKey =
  | 'idle'
  | 'greeting'
  | 'about_me_intro'
  | 'skills_intro'
  | 'experience_intro'
  | 'projects_intro'
  | 'projects_list_spoken'
  | 'project_detail_specific'
  | 'education_intro'
  | 'certifications_intro'
  | 'publication_intro'
  | 'additional_info_intro'
  // | 'voice_tour_active' // Controller no longer directly manages this if ContentReader is independent
  | 'post_voice_tour_qa'
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting'
  | 'tour_paused';

const IntegratedAssistantController: React.FC = () => {
  console.log("IntegratedAssistantController: Rendering or re-rendering.");

  // Chat Interface State
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [showChatBubble, setShowChatBubble] = useState(true); // Default to true
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false); // For Q&A
  const [chatInput, setChatInput] = useState('');
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);

  // Overall Assistant State
  const [assistantMode, setAssistantMode] = useState<TourStepKey>('idle');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const initialGreetingDoneRef = useRef(false);
  const isMountedRef = useRef(false);

  // Speech Synthesis State
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [isSynthReady, setIsSynthReady] = useState(false);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // const [isSpeakingForAvatar, setIsSpeakingForAvatar] = useState(false); // Tied to SimpleAvatarDisplay, removed for now

  // Voice Tour (ContentReader) Control - Kept for potential future re-integration
  // const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  // const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  // const [currentVoiceTourSectionId, setCurrentVoiceTourSectionId] = useState<string | null>('about');

  // Scroll-to-end state
  const [contactSectionInViewForNoThanks, setContactSectionInViewForNoThanks] = useState(false);
  const [endOfPageGreetingDone, setEndOfPageGreetingDone] = useState(false);

  const { ref: contactSectionRef, inView: contactSectionIsVisible } = useInView({ threshold: 0.3 });
  
  useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement && contactSectionRef) {
      (contactSectionRef as (node?: Element | null | undefined) => void)(contactElement);
    }
  }, [contactSectionRef]);

  // Initialize Speech Synthesis and attempt initial greeting
  useEffect(() => {
    console.log("IntegratedAssistantController: Component did mount. Setting up synth.");
    isMountedRef.current = true;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const checkVoices = () => {
        if (!synthRef.current) return;
        const voices = synthRef.current.getVoices();
        if (voices && voices.length > 0) {
          setIsSynthReady(true);
          console.log("IntegratedAssistantController: Speech synthesis initialized with voices.");
          if (synthRef.current) synthRef.current.onvoiceschanged = null;
        }
      };

      if (synthRef.current.getVoices().length > 0) {
        checkVoices();
      } else {
        synthRef.current.onvoiceschanged = checkVoices;
      }
    } else {
      console.warn("IntegratedAssistantController: Speech synthesis not supported by this browser.");
    }

    return () => {
      console.log("IntegratedAssistantController: Component unmounting. Cleaning up synth.");
      isMountedRef.current = false;
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
        if (controllerUtteranceRef.current) {
          controllerUtteranceRef.current.onend = null;
          controllerUtteranceRef.current.onerror = null;
        }
        synthRef.current.cancel();
      }
    };
  }, []);

  const speakTextNow = useCallback((text: string, onEnd?: () => void, isChainedCall = false) => {
    if (!isMountedRef.current || !synthRef.current || !isSynthReady) {
      console.warn("IntegratedAssistantController: speakTextNow called but synth not ready or not mounted. Text:", text);
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: speakTextNow attempting to speak: "${text.substring(0,50)}..."`);

    if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
    }
    
    if (!isChainedCall && (synthRef.current.speaking)) { // Only cancel if actively speaking, not just pending
        console.log("IntegratedAssistantController: Cancelling previous controller speech before new one (if not chained).");
        synthRef.current.cancel();
    }
    controllerUtteranceRef.current = null; // Clear ref before new utterance

    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance;
    
    // setIsSpeakingForAvatar(true); // Removed, tied to SimpleAvatarDisplay

    utterance.onend = () => {
      console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0,50)}..."`);
      // setIsSpeakingForAvatar(false); // Removed
      if (controllerUtteranceRef.current === utterance) {
          controllerUtteranceRef.current.onend = null; // Important: clear handler from specific utterance
          controllerUtteranceRef.current.onerror = null; // Important: clear handler from specific utterance
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      let errorDetails = "Unknown speech error";
      if (event && (event as SpeechSynthesisErrorEvent).error) {
        errorDetails = (event as SpeechSynthesisErrorEvent).error;
      }
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Full event object:", event);
      // setIsSpeakingForAvatar(false); // Removed
      if (controllerUtteranceRef.current === utterance) {
          controllerUtteranceRef.current.onend = null; // Important
          controllerUtteranceRef.current.onerror = null; // Important
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };
    synthRef.current.speak(utterance);
  }, [isSynthReady, synthRef, /* setIsSpeakingForAvatar - removed */ ]);

  const addMessageToChat = useCallback((sender: 'ai' | 'user', content: ReactNode, speakableTextOverride?: string) => {
    console.log(`IntegratedAssistantController: Adding message from ${sender}. Speakable: ${!!speakableTextOverride}`);
    const newMessageId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setChatMessages(prev => [...prev, { id: newMessageId, sender, text: content, speakableText: speakableTextOverride || (typeof content === 'string' ? content : undefined) }]);
  }, [setChatMessages]);


  const initiateGreeting = useCallback(() => {
    if (!isMountedRef.current) {
      console.log("IntegratedAssistantController: initiateGreeting called too early (not mounted).");
      return;
    }
    if (initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: Greeting already done, skipping.");
      return;
    }
    console.log("IntegratedAssistantController: Initiating greeting NOW.");
    
    // Clear any previous chat state specifically for the greeting
    setChatMessages([]); 
    setChatInterfaceRenderKey(prev => prev + 1); 
    
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    
    addMessageToChat('ai', <p>{greetingText}</p>, greetingText);
    setChatQuickReplies([
      { text: "Guide Me Through Portfolio", action: 'start_voice_tour_yes', icon: <Play /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle /> },
    ]);
    
    setIsChatInterfaceOpen(true);
    setShowBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); 
    
    console.log("IntegratedAssistantController: Chat interface set to OPEN for greeting.");

    if (isSynthReady && synthRef.current) {
        console.log("IntegratedAssistantController: Attempting to speak (initial greeting)...");
        speakTextNow(greetingText);
    } else {
        console.warn("IntegratedAssistantController: Synth not ready for initial greeting speech, UI should still appear.");
    }
    initialGreetingDoneRef.current = true; // Mark as done after attempting
  }, [addMessageToChat, speakTextNow, isSynthReady, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatInterfaceRenderKey]);

  // Effect to trigger initial greeting
  useEffect(() => {
    console.log("IntegratedAssistantController: Initial Greeting Effect Check...", {
        isMounted: isMountedRef.current,
        isSynthReady,
        greetingDone: initialGreetingDoneRef.current,
    });
    if (isMountedRef.current && isSynthReady && !initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: Conditions MET for initial greeting. Calling initiateGreeting.");
      // Use a small timeout to ensure the browser has had a moment to settle
      const timeoutId = setTimeout(() => {
          if (isMountedRef.current && !initialGreetingDoneRef.current) { // Double check before calling
              initiateGreeting();
          }
      }, 100); // Small delay
      return () => clearTimeout(timeoutId);
    }
  }, [isSynthReady, initiateGreeting]); // isMountedRef.current is not a reactive dependency for useEffect

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 
    setUserRespondedToGreeting(true);

    if (action === 'start_voice_tour_yes') {
      const confirmationText = "Excellent! Let's begin the guided tour. I'll narrate each section for you.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => {
        if (isMountedRef.current) {
          console.log("IntegratedAssistantController: Starting ContentReader tour.");
          setIsChatInterfaceOpen(true); // Keep chat open as per new request
          setShowBubble(false); // Bubble hidden while chat is open
          setAssistantMode('voice_tour_active');
          // setCurrentVoiceTourSectionId('about'); // ContentReader starts from its first defined section
          // setStartVoiceTourSignal(prev => !prev); 
          // TODO: Implement logic to actually start ContentReader
          // For now, just logs
          console.log("TODO: Implement ContentReader start signal and UI for its narration here.");
        }
      });
    } else if (action === 'decline_tour') {
      const declineText = "Alright. Feel free to explore at your own pace. You can click my icon if you have questions later!";
      addMessageToChat('ai', <p>{declineText}</p>, declineText);
      speakTextNow(declineText, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false);
          setShowBubble(true);
          setAssistantMode('tour_declined_pending_scroll');
        }
      });
    } else if (action.startsWith('project_detail_')) {
      const projectName = action.replace('project_detail_', '').replace(/_/g, ' ');
      // const project = pageProjectsData.find(p => p.title.replace(/\s+/g, '_').replace(/[^\w-]+/g, '') === action.replace('project_detail_', ''));
      // if (project) {
      //   addMessageToChat('ai', <p>{project.description}</p>, project.description);
      //   speakTextNow(project.description, () => {
      //     if(isMountedRef.current) {
      //       addMessageToChat('ai', "Which other project would you like to explore, or shall we move on?", "Which other project would you like to explore, or shall we move on?");
      //       setChatQuickReplies(projectQuickReplies); // Re-show project options
      //     }
      //   });
      // }
      console.log(`TODO: Implement project detail for ${projectName}`);
    } else if (action === 'next_section_education') {
      // addMessageToChat('ai', "Moving to Education.", "Moving to Education.");
      // speakTextNow("Moving to Education.", () => {
      //   if (isMountedRef.current) {
      //     setIsChatInterfaceOpen(false); // Hide chat for presentation
      //     setShowBubble(false); // Hide bubble during auto-advance
      //     setCurrentVoiceTourSectionId('education-section');
      //     setStartVoiceTourSignal(prev => !prev);
      //     setAssistantMode('voice_tour_active');
      //   }
      // });
      console.log("TODO: Implement move to education from projects");
    } else if (action === 'ask_another_question' || action === 'restart_qa') {
        const qaPrompt = "Sure, what else would you like to know about Chakradhar?";
        addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
        speakTextNow(qaPrompt);
        setAssistantMode('qa'); 
        setChatQuickReplies([]);
    } else if (action === 'download_resume') {
        window.open('/Lakshmi_resume.pdf', '_blank');
        addMessageToChat('ai', "Your download should start shortly.", "Your download should start shortly.");
        speakTextNow("Your download should start shortly.");
    } else if (action === 'end_chat_final') {
        const endText = "Thanks for visiting! Have a great day.";
        addMessageToChat('ai', <p>{endText}</p>, endText);
        speakTextNow(endText, () => {
            if (isMountedRef.current) {
                setIsChatInterfaceOpen(false);
                setShowBubble(true);
                setAssistantMode('idle');
            }
        });
    }
  }, [
    addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatQuickReplies, 
    // pageProjectsData, // Removed, project details handled by ContentReader now or future Q&A
    // projectQuickReplies, // Removed
    // setCurrentVoiceTourSectionId, setStartVoiceTourSignal // Will re-add when ContentReader is fully active
  ]);

  const handleSendMessageToAI = useCallback(async (userInput: string) => {
    if (!isMountedRef.current) return;
    addMessageToChat('user', userInput);
    setIsChatbotLoading(true);
    // setAvatarAction('thinking'); // If we had an avatar

    try {
      // const aiResponse = await askAboutResume({ question: userInput }); // Genkit call
      const aiResponse = { answer: `Regarding "${userInput}", I'm ready to consult Chakradhar's full knowledge base. (Q&A Placeholder)` };
      addMessageToChat('ai', <p>{aiResponse.answer}</p>, aiResponse.answer);
      speakTextNow(aiResponse.answer, () => {
        // if(isMountedRef.current) setAvatarAction('idle');
      });
    } catch (error) {
      console.error("Error fetching AI Q&A response:", error);
      const errorText = "Sorry, I couldn't get a response for that right now.";
      addMessageToChat('ai', <p>{errorText}</p>, errorText);
      speakTextNow(errorText, () => {
        // if(isMountedRef.current) setAvatarAction('idle');
      });
    } finally {
      if(isMountedRef.current) {
        setIsChatbotLoading(false);
      }
    }
  }, [addMessageToChat, speakTextNow, /* askAboutResume - removed for now */]);

  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    // setStopVoiceTourSignal(prev => !prev); // Temporarily removed as ContentReader is simplified

    if (isChatInterfaceOpen) { // Closing the chat
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      if (assistantMode !== 'tour_declined_pending_scroll' && assistantMode !== 'idle' && assistantMode !== 'scrolled_to_end_greeting') {
        setAssistantMode('tour_paused'); 
      }
    } else { // Opening the chat via bubble
      initialGreetingDoneRef.current = false; // Allow greeting/re-greeting
      setUserRespondedToGreeting(false);
      setEndOfPageGreetingDone(false);
      setChatInterfaceRenderKey(prev => prev + 1); // Force re-render chat interface for clean state
      initiateGreeting();
    }
  }, [isChatInterfaceOpen, assistantMode, initiateGreeting, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatInterfaceRenderKey /*, setStopVoiceTourSignal - removed */]);
  
  // Effect for scroll-to-end greeting if tour was declined
  useEffect(() => {
    if (userRespondedToGreeting && assistantMode === 'tour_declined_pending_scroll' && contactSectionIsVisible && !endOfPageGreetingDone && !isChatInterfaceOpen) {
      console.log("IntegratedAssistantController: Scrolled to contact after declining tour. Popping up Q&A.");
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      setChatMessages([]); 
      setChatInterfaceRenderKey(prev => prev + 1);
      setAssistantMode('scrolled_to_end_greeting');
      const endScrollMessage = "Thanks for exploring! Do you have any questions about Chakradhar's work or experience before you go?";
      addMessageToChat('ai', <p>{endScrollMessage}</p>, endScrollMessage);
      setChatQuickReplies([
        { text: "Ask a Question", action: 'restart_qa', icon: <MessageCircleQuestion /> },
        { text: "No, I'm Good", action: 'end_chat_final', icon: <XCircle /> },
      ]);
      speakTextNow(endScrollMessage);
      setEndOfPageGreetingDone(true);
    }
  }, [contactSectionIsVisible, userRespondedToGreeting, assistantMode, endOfPageGreetingDone, isChatInterfaceOpen, addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey]);
  
  console.log("IntegratedAssistantController State: isChatOpen:", isChatInterfaceOpen, "showBubble:", showChatBubble, "mode:", assistantMode);

  return (
    <>
      {/* <SimpleAvatarDisplay isSpeaking={isSpeakingForAvatar} isVisible={true} /> */} {/* Temporarily removed */}
      
      <ChatbotBubble onClick={mainBubbleClickHandler} isVisible={showChatBubble} />

      <InteractiveChatbot
        key={chatInterfaceRenderKey}
        isOpen={isChatInterfaceOpen}
        messages={chatMessages}
        quickReplies={chatQuickReplies}
        isLoading={isChatbotLoading}
        currentInput={chatInput}
        onInputChange={(e) => setChatInput(e.target.value)}
        onSendMessage={(e) => {
          e.preventDefault();
          if (chatInput.trim()) {
            handleSendMessageToAI(chatInput);
            setChatInput('');
          }
        }}
        onClose={mainBubbleClickHandler} 
        onQuickReplyClick={handleQuickReplyAction}
        mode={
          assistantMode === 'greeting' || 
          assistantMode === 'post_voice_tour_qa' || 
          assistantMode === 'scrolled_to_end_greeting' ||
          assistantMode === 'project_selection' // Assuming this mode will exist
            ? 'quick-reply' 
            : 'qa'
        }
      />

      {/* <ContentReader
        startTourSignal={startVoiceTourSignal}
        stopTourSignal={stopVoiceTourSignal}
        currentSectionIdToSpeak={currentVoiceTourSectionId}
        speakAndScrollProp={(sectionId, text, onSpeechEndCallback) => {
            addMessageToChat('ai', <div className="prose prose-sm max-w-none"><p><em>Narrating: {sectionId.replace(/-/g, ' ').replace(/ section/i, '')}</em></p><p>{text}</p></div>, text);
            smoothScrollTo(sectionId);
            speakTextNow(text, onSpeechEndCallback, true); // isChainedCall = true
        }}
        onProjectsIntroSpoken={handleProjectsStepInController} // Placeholder
        onTourComplete={handleVoiceTourComplete} // Placeholder
      /> */} {/* Temporarily removed */}
    </>
  );
};

export default IntegratedAssistantController;

    