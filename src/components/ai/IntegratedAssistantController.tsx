
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BrainCircuit, BotMessageSquare, Play, Volume2, VolumeX } from 'lucide-react';

type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused_by_user'
  | 'qa'
  | 'post_voice_tour_qa'
  | 'scrolled_to_end_greeting'
  | 'tour_declined_pending_scroll';

const IntegratedAssistantController: React.FC = () => {
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [showChatBubble, setShowChatBubble] = useState(true); // Show bubble by default
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);

  const initialGreetingDoneRef = useRef(false);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdCounterRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isMountedRef = useRef(false);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1, // Trigger when 10% of the contact section is visible
    triggerOnce: false, // Allow re-triggering if needed, though current logic makes it once
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    // Assign the contact section ref for intersection observer
    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactSectionRef(contactElement);
    }
    return () => {
      isMountedRef.current = false;
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
      if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
      }
    };
  }, [contactSectionRef]);
  
  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !text) return;
    
    // Cancel any previous speech from this specific controller instance
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = (event) => {
      console.error("IntegratedAssistantController speakTextNow error:", event);
      if (onEnd) onEnd(); // Ensure flow continues or cleans up
    };
    synthRef.current.speak(utterance);
  }, []);

  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    messageIdCounterRef.current += 1;
    const newMessage: ChatbotMessageType = {
      id: `${Date.now()}-${messageIdCounterRef.current}`,
      sender,
      text,
      timestamp: new Date(),
      speakableTextOverride,
    };
    setChatMessages(prev => [...prev, newMessage]);
    return newMessage; // Return the new message for potential immediate use
  }, []);

  const initiateGreeting = useCallback(() => {
    console.log("IntegratedAssistantController: Initiating greeting.");
    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }
    setChatMessages([]); // Clear previous messages for a fresh greeting
    const greetingText = "Hi there! I’m your assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', greetingText);
    speakTextNow(greetingText);

    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); // Reset this, as user hasn't *responded* yet
    initialGreetingDoneRef.current = true; // Mark that greeting has been initiated
  }, [addMessageToChat, speakTextNow]);

  useEffect(() => {
    if (isMountedRef.current && !initialGreetingDoneRef.current && assistantMode === 'idle' && !isChatInterfaceOpen) {
        // Only initiate greeting if it hasn't been done, controller is idle, and chat isn't already open.
        // This ensures it effectively runs once on mount under right conditions.
        console.log("IntegratedAssistantController: Initial greeting useEffect triggered.");
        initiateGreeting();
    }
  }, [assistantMode, isChatInterfaceOpen, initiateGreeting]);


  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); // Clear quick replies after one is clicked
    setUserRespondedToGreeting(true); // Mark that the user has now responded to the initial greeting

    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }

    if (action === 'start_voice_tour') {
      addMessageToChat('user', "Yes, Guide Me");
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', startMessage);
      speakTextNow(startMessage, () => {
        setStartVoiceTourSignal(true); // Start ContentReader *after* "Great!" is spoken
      });
      setIsChatInterfaceOpen(false); // Close chat interface
      setShowChatBubble(false);    // Hide bubble during automated voice tour
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      addMessageToChat('ai', "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!");
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true); // Show bubble after declining
      setAssistantMode('tour_declined_pending_scroll'); // New mode to track this state
    } else if (action === 'open_qa') {
      setAssistantMode('qa');
      addMessageToChat('ai', "Great! What would you like to know about Chakradhar?");
       // No quick replies here, user types in 'qa' mode
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank'); // Ensure 'lakshmi_resume.pdf' is in your public folder
      addMessageToChat('ai', "The resume is being downloaded. Anything else I can help with?");
       setChatQuickReplies([
        { text: "Ask another Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
    } else if (action === 'end_chat_interaction' || action === 'not_right_now_scrolled_end') {
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true);
      setAssistantMode('idle');
    }
  }, [addMessageToChat, speakTextNow]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
    setStartVoiceTourSignal(false); // Ensure ContentReader stops if it hasn't.
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    
    setChatMessages([]); // Clear previous messages
    addMessageToChat('ai', "The guided audio tour is complete! Feel free to ask any questions you have about Chakradhar using the chat, or download his resume.");
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true); // Open chat for Q&A
    setShowChatBubble(false); // Hide bubble while chat is open
  }, [addMessageToChat]);
  
  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);

    if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
        tourTimeoutRef.current = null;
    }

    if (isChatInterfaceOpen) { // If chat is open, clicking bubble/X closes it
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true);
        setChatQuickReplies([]); // Clear replies when closing
        if (assistantMode === 'voice_tour_active' && startVoiceTourSignal) {
            // User closed chat during active voice tour
            setStopVoiceTourSignal(true); // Signal ContentReader to stop
            setStartVoiceTourSignal(false);
            setAssistantMode('voice_tour_paused_by_user'); // New state to indicate tour was interrupted
        } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
             // User closed initial greeting before responding
             setAssistantMode('tour_declined_pending_scroll'); 
        } else if (assistantMode !== 'voice_tour_active') { // If not in active tour, go idle
          setAssistantMode('idle');
        }
        // if voice_tour_active but interface was opened for some other reason, closing it shouldn't change assistantMode from voice_tour_active
    } else { // Chat is closed, so open it
        setStopVoiceTourSignal(false); // Clear any stop signal for ContentReader
        setShowChatBubble(false); // Hide bubble when chat opens
        setChatMessages([]); // Clear previous messages for a fresh interaction

        if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
            setAssistantMode('post_voice_tour_qa'); // Stay in post-tour Q&A mode
            addMessageToChat('ai', "Welcome back! The tour is complete. Still have questions about Chakradhar or want to download the resume?");
            setChatQuickReplies([
              { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
              { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
              { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
        } else if (assistantMode === 'scrolled_to_end_greeting') {
             // Re-engage after scrolling to end post-decline
             addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
             setChatQuickReplies([
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
        } else if (assistantMode === 'voice_tour_paused_by_user') {
            // User had paused the voice tour by closing chat, now re-opens via bubble
            addMessageToChat('ai', "The voice tour was paused. Would you like to ask a question, or perhaps I can help with something else?");
            setChatQuickReplies([
              { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
              // Option to resume tour could be added here
              { text: "End Interaction", action: 'end_chat_interaction', icon: <Square className="mr-2 h-4 w-4" /> },
            ]);
            setAssistantMode('qa'); // Transition to Q&A mode
        } else { // Default: initiate greeting if tour hasn't started or was properly ended
            initiateGreeting(); // This will also set assistantMode to 'greeting'
        }
        setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen,
    assistantMode,
    voiceTourCompleted,
    startVoiceTourSignal,
    userRespondedToGreeting,
    addMessageToChat,
    initiateGreeting,
  ]);

  useEffect(() => {
    // This effect handles the scenario where the user declined the tour and then scrolls to the contact section.
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined. Opening chat for questions.");
      setChatMessages([]);
      addMessageToChat('ai', "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions about his work or experience?");
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setShowChatBubble(false);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true); // Prevent this from re-triggering
    }
  }, [contactSectionInView, assistantMode, hasShownScrolledToEndGreeting, addMessageToChat, isChatInterfaceOpen]);

  return (
    <>
      <ChatbotBubble
        onClick={mainBubbleClickHandler}
        isVisible={showChatBubble}
      />
      <InteractiveChatbot
        isOpen={isChatInterfaceOpen}
        mode={assistantMode} 
        initialMessages={chatMessages}
        initialQuickReplies={chatQuickReplies}
        onClose={mainBubbleClickHandler} // Use the same handler for closing via 'X'
        onQuickReplyAction={handleQuickReplyAction}
      />
      <ContentReader
        startTour={startVoiceTourSignal}
        onTourComplete={handleVoiceTourComplete}
        stopTourSignal={stopVoiceTourSignal}
      />
    </>
  );
};

export default IntegratedAssistantController;

    