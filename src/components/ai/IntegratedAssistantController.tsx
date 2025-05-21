"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { 
  type ChatMessage as ChatbotMessageType, 
  type QuickReply as ChatbotQuickReplyType 
} from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BotMessageSquare, Play } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { projectsData as pageProjectsData } from '@/components/sections/projects';


type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused' // When ContentReader is paused by user (not via project interaction)
  | 'projects_interactive' // Chat open for project selection
  | 'post_voice_tour_qa'
  | 'qa_active'
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting';

interface ChatMessage extends ChatbotMessageType {}
interface ChatQuickReply extends ChatbotQuickReplyType {}

const IntegratedAssistantController: React.FC = () => {
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [showChatBubble, setShowBubble] = useState(true);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatQuickReply[]>([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState<string | null>('about'); // Start tour with 'about'
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [isSynthReady, setIsSynthReady] = useState(false);
  
  const initialGreetingDoneRef = useRef(false);
  const isMountedRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messageIdCounterRef = useRef(0);
  const projectTitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { ref: contactViewRef, inView: contactSectionInView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        setIsSynthReady(true);
      } else {
        synthRef.current.onvoiceschanged = () => {
          if(synthRef.current && synthRef.current.onvoiceschanged) { // Check if still exists
            setIsSynthReady(true);
            synthRef.current.onvoiceschanged = null;
          }
        };
      }
    }
    return () => {
      isMountedRef.current = false;
      if (synthRef.current) synthRef.current.cancel();
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    };
  }, []);

  const speakTextNow = useCallback((text: string, onEnd?: () => void, isChainedCall = false) => {
    if (!isMountedRef.current || !synthRef.current || !isSynthReady) {
      console.warn("IntegratedAssistantController: Speech synth not ready or component not mounted, cannot speak:", text);
      if (onEnd) onEnd();
      return;
    }

    // Clear handlers from a previous controller utterance
    if (controllerUtteranceRef.current) {
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }

    if (!isChainedCall && synthRef.current.speaking) {
      console.log("IntegratedAssistantController: Cancelling (isSpeaking) previous speech before new speakTextNow call for:", `"${text.substring(0,30)}..."`);
      synthRef.current.cancel();
    }
    controllerUtteranceRef.current = null; // Ensure it's cleared after cancel

    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance;

    utterance.onend = () => {
      console.log("IntegratedAssistantController speakTextNow ONEND for text:", `"${text.substring(0,50)}..."`);
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current.onerror = null; // Clear error handler too
          controllerUtteranceRef.current = null; 
          if (onEnd) onEnd();
      } else {
        console.log("IntegratedAssistantController: Stale onEnd ignored for:", `"${text.substring(0,50)}..."`);
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error; 
      }
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current.onend = null; 
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };
    
    // Check if voices are loaded, if not, try speaking after they load
    const voices = synthRef.current.getVoices();
    let spokenOrQueuedThisCall = false;

    const tryToSpeak = () => {
      if (spokenOrQueuedThisCall || !synthRef.current || !controllerUtteranceRef.current || controllerUtteranceRef.current !== utterance) return;
      spokenOrQueuedThisCall = true;
      console.log("IntegratedAssistantController: Speaking with synthRef:", `"${text.substring(0,50)}..."`);
      synthRef.current.speak(utterance);
    };

    if (voices.length > 0) {
      tryToSpeak();
    } else {
      const voiceLoadTimeout = setTimeout(() => {
        if (isMountedRef.current && !spokenOrQueuedThisCall) {
           console.warn("IntegratedAssistantController: Voices did not load in time, attempting to speak anyway for:", `"${text.substring(0,50)}..."`);
           tryToSpeak(); // Attempt to speak anyway, browser might use a default
        }
      }, 500); // Wait up to 500ms for voices

      const onVoicesChangedHandler = () => {
        if (synthRef.current) synthRef.current.onvoiceschanged = null;
        clearTimeout(voiceLoadTimeout);
        if (isMountedRef.current && !spokenOrQueuedThisCall) {
          console.log("IntegratedAssistantController: Voices loaded, trying to speak:", `"${text.substring(0,50)}..."`);
          tryToSpeak();
        }
      };
      if(synthRef.current) synthRef.current.onvoiceschanged = onVoicesChangedHandler;
      // Double check if voices loaded between initial check and setting listener
      if (synthRef.current && synthRef.current.getVoices().length > 0 && !spokenOrQueuedThisCall) {
        onVoicesChangedHandler();
      }
    }
  }, [isMountedRef, isSynthReady]);

  const addMessageToChat = useCallback((sender: 'user' | 'ai', textNode: React.ReactNode, speakableText?: string) => {
    setChatMessages(prev => {
      messageIdCounterRef.current += 1;
      const newMessage: ChatMessage = { id: `${Date.now()}-${messageIdCounterRef.current}`, sender, text: textNode, speakableTextOverride: speakableText };
      return [...prev, newMessage];
    });
  }, [setChatMessages]);
  
  const initiateGreeting = useCallback(() => {
    if (!isMountedRef.current || initialGreetingDoneRef.current || !isSynthReady) {
      console.log("IntegratedAssistantController: Skipping initial greeting. Done:", initialGreetingDoneRef.current, "Mounted:", isMountedRef.current, "SynthReady:", isSynthReady);
      return;
    }
    console.log("IntegratedAssistantController: Initiating greeting.");
    
    setChatMessages([]);
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', <p>{greetingText}</p>, greetingText);
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <Play className="h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="h-4 w-4" /> },
    ]);
    
    setIsChatInterfaceOpen(true);
    setShowBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false);

    requestAnimationFrame(() => {
      if (isMountedRef.current && synthRef.current && isSynthReady) {
        console.log("IntegratedAssistantController: Speaking initial greeting (deferred).");
        speakTextNow(greetingText);
      }
    });
    initialGreetingDoneRef.current = true;
  }, [addMessageToChat, speakTextNow, isSynthReady, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatMessages, setChatQuickReplies]);

  useEffect(() => {
    if (!initialGreetingDoneRef.current && isMountedRef.current && isSynthReady && assistantMode === 'idle' && !isChatInterfaceOpen) {
      console.log("IntegratedAssistantController: Initial greeting effect triggered.");
      initiateGreeting();
    }
  }, [initiateGreeting, isSynthReady, assistantMode, isChatInterfaceOpen]);


  const handleQuickReplyAction = useCallback((action: string) => {
    console.log("IntegratedAssistantController: Quick reply action:", action);
    setChatQuickReplies([]);

    if (action === 'start_voice_tour_yes') {
      setUserRespondedToGreeting(true);
      const confirmationText = "Excellent! Let's begin the tour.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false); // Chat box closes
          setShowBubble(false); // Bubble also hides during active tour
          setCurrentTourStep('about'); // Start tour from 'about' section
          setStartVoiceTourSignal(true);
          setStopVoiceTourSignal(false);
          setAssistantMode('voice_tour_active');
        }
      });
    } else if (action === 'decline_tour') {
      setUserRespondedToGreeting(true);
      const declineMessage = "Alright. Feel free to explore at your own pace. You can click my icon if you have questions later!";
      addMessageToChat('ai', <p>{declineMessage}</p>, declineMessage);
      speakTextNow(declineMessage, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false);
          setShowBubble(true);
          setAssistantMode('tour_declined_pending_scroll');
        }
      });
    } else if (action === 'ask_question_init') {
      setAssistantMode('qa_active');
      const qaPrompt = "Sure, what would you like to know about Chakradhar?";
      addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
      speakTextNow(qaPrompt);
    } else if (action === 'download_resume_action') {
      addMessageToChat('ai', <p>Downloading the resume...</p>, "Downloading the resume.");
      speakTextNow("Downloading the resume.");
      window.open('/Lakshmi_resume.pdf', '_blank');
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false); setShowBubble(true); setAssistantMode('idle');
        }
      }, 1000);
    } else if (action === 'end_chat_action') {
      addMessageToChat('ai', <p>Thanks for visiting!</p>, "Thanks for visiting!");
      speakTextNow("Thanks for visiting!", () => {
        if (isMountedRef.current) {
         setIsChatInterfaceOpen(false); setShowBubble(true); setAssistantMode('idle');
        }
      });
    }
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setCurrentTourStep, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatQuickReplies]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
    if (isMountedRef.current) {
      setStartVoiceTourSignal(false);
      setVoiceTourCompleted(true);
      setAssistantMode('post_voice_tour_qa');
      const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to know more about anything else?";
      addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
      speakTextNow(endMessage);
      setChatQuickReplies([
        { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
        { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
    }
  }, [addMessageToChat, speakTextNow, setStartVoiceTourSignal, setVoiceTourCompleted, setAssistantMode, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies]);

  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && userRespondedToGreeting && !startVoiceTourSignal && !voiceTourCompleted) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined.");
      setAssistantMode('scrolled_to_end_greeting');
      const endScrollMessage = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions?";
      addMessageToChat('ai', <p>{endScrollMessage}</p>, endScrollMessage);
      speakTextNow(endScrollMessage);
      setChatQuickReplies([
        { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" />  },
        { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
    }
  }, [contactSectionInView, assistantMode, userRespondedToGreeting, startVoiceTourSignal, voiceTourCompleted, addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies, setAssistantMode]);

  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    if (isMountedRef.current && synthRef.current) {
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
        controllerUtteranceRef.current = null;
      }
      synthRef.current.cancel();
    }
    setStopVoiceTourSignal(true); 

    if (isChatInterfaceOpen) {
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      setStartVoiceTourSignal(false); // Ensure voice tour doesn't auto-restart
      if (assistantMode === 'voice_tour_active') {
        setAssistantMode('voice_tour_paused');
      } else if (assistantMode !== 'tour_declined_pending_scroll' && assistantMode !== 'scrolled_to_end_greeting') {
        setAssistantMode(voiceTourCompleted ? 'post_voice_tour_qa' : 'idle');
      }
    } else { 
      // If bubble is clicked to open chat
      if (assistantMode === 'voice_tour_paused') {
        // Re-present options for paused tour or resume
        // For now, let's just offer to restart or ask questions
        setAssistantMode('post_voice_tour_qa'); // or a new mode 'tour_paused_interactive'
        addMessageToChat('ai', <p>The guided tour is paused. You can ask a question or resume the tour.</p>, "The guided tour is paused. You can ask a question or resume the tour.");
        // Add relevant quick replies (e.g., "Resume Tour", "Ask Question")
        setChatQuickReplies([
            { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
            { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
            { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
        ]);
      } else if (!userRespondedToGreeting || assistantMode === 'idle' || assistantMode === 'tour_declined_pending_scroll' || assistantMode === 'scrolled_to_end_greeting') {
        initiateGreeting(); // Re-initiate greeting if tour wasn't started or was declined
      } else if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
        setAssistantMode('post_voice_tour_qa');
        const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to know more about anything else?";
        addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
        // speakTextNow(endMessage); // Avoid speaking again if just reopening
        setChatQuickReplies([
          { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
          { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
          { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
        ]);
      }
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
    }
  }, [
    isChatInterfaceOpen, assistantMode, userRespondedToGreeting, voiceTourCompleted, 
    initiateGreeting, addMessageToChat, speakTextNow, 
    setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStopVoiceTourSignal, setStartVoiceTourSignal,
    setChatQuickReplies, setChatMessages
  ]);
  
  useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactViewRef(contactElement);
    }
  }, [contactViewRef]);

  const effectiveShowBubble = showChatBubble && !isChatInterfaceOpen;
  
  if (!isMounted) return null; // Don't render anything until client-side mount

  return (
    <>
      <ChatbotBubble onClick={mainBubbleClickHandler} isVisible={effectiveShowBubble} />
      <InteractiveChatbot
        key={chatInterfaceRenderKey}
        isOpen={isChatInterfaceOpen}
        onClose={mainBubbleClickHandler}
        initialMessages={chatMessages}
        initialQuickReplies={chatQuickReplies}
        onQuickReplyAction={handleQuickReplyAction}
        isLoading={isChatbotLoading} 
        currentMode={assistantMode}
      />
      <ContentReader
        startTourSignal={startVoiceTourSignal}
        stopTourSignal={stopVoiceTourSignal}
        currentGlobalStepId={currentTourStep}
        onTourComplete={handleVoiceTourComplete}
        onProjectsStepReached={() => { /* This will be replaced by direct project iteration in controller */ }}
        addMessageToChat={addMessageToChat}
        speakTextProp={speakTextNow} 
      />
    </>
  );
};

export default IntegratedAssistantController;
