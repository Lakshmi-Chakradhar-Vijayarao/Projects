
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BrainCircuit, BotMessageSquare, Play } from 'lucide-react';

type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused_by_user' // When user closes chat during active tour
  | 'qa'
  | 'post_voice_tour_qa'
  | 'scrolled_to_end_greeting'
  | 'tour_declined_pending_scroll';

const IntegratedAssistantController: React.FC = () => {
  // State hooks must be at the top
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [showChatBubble, setShowChatBubble] = useState(true);
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);

  // Ref hooks after state hooks
  const initialGreetingDoneRef = useRef(false);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For auto-advancing tour
  const messageIdCounterRef = useRef(0); // For unique message IDs

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  // Callback hooks
  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    messageIdCounterRef.current += 1;
    setChatMessages(prev => [...prev, {
      id: `${Date.now()}-${messageIdCounterRef.current}`, // Enhanced unique ID
      sender,
      text,
      timestamp: new Date(),
      speakableTextOverride
    }]);
  }, [setChatMessages]);

  const initiateGreeting = useCallback(() => {
    console.log("IntegratedAssistantController: Initiating greeting.");
    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }
    setChatMessages([]);
    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false);
  }, [addMessageToChat, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setAssistantMode, setUserRespondedToGreeting, setShowChatBubble]);

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]);
    setUserRespondedToGreeting(true);

    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }

    if (action === 'start_voice_tour') {
      addMessageToChat('user', "Yes, Guide Me");
      addMessageToChat('ai', "Great! Starting the guided audio tour now. Please listen as I walk you through Chakradhar's portfolio sections.");
      setIsChatInterfaceOpen(false);
      setShowChatBubble(false); // Hide bubble during automated voice tour
      setStartVoiceTourSignal(true);
      setStopVoiceTourSignal(false);
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      addMessageToChat('ai', "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!");
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true);
      setAssistantMode('tour_declined_pending_scroll');
    } else if (action === 'open_qa') {
      setAssistantMode('qa');
      addMessageToChat('ai', "Great! What would you like to know about Chakradhar?");
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank');
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
  }, [addMessageToChat, setChatQuickReplies, setUserRespondedToGreeting, setIsChatInterfaceOpen, setShowChatBubble, setStartVoiceTourSignal, setStopVoiceTourSignal, setAssistantMode]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed.");
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    setChatMessages([]);
    addMessageToChat('ai', "The guided audio tour is complete! Feel free to ask any questions you have about Chakradhar using the chat, or download his resume.");
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
  }, [addMessageToChat, setStartVoiceTourSignal, setStopVoiceTourSignal, setVoiceTourCompleted, setAssistantMode, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble]);

  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);

    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }

    if (isChatInterfaceOpen) {
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true);
      setChatQuickReplies([]);
      if (assistantMode === 'voice_tour_active' && startVoiceTourSignal) {
        setStopVoiceTourSignal(true);
        setStartVoiceTourSignal(false);
        setAssistantMode('voice_tour_paused_by_user');
      } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
         setAssistantMode('tour_declined_pending_scroll');
      } else if (assistantMode !== 'voice_tour_active') { // If not in active tour, go idle
        setAssistantMode('idle');
      }
      // if voice_tour_active but interface was opened for some other reason, closing it shouldn't change assistantMode from voice_tour_active
    } else { // Chat is closed, so open it
      setStopVoiceTourSignal(false); // Clear any stop signal
      setShowChatBubble(false);
      setChatMessages([]);

      if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
        setAssistantMode('post_voice_tour_qa');
        addMessageToChat('ai', "Welcome back! The tour is complete. Still have questions about Chakradhar or want to download the resume?");
        setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
          { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
         setIsChatInterfaceOpen(true);
      } else if (assistantMode === 'scrolled_to_end_greeting') {
         addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
         setChatQuickReplies([
            { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
            { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
         setIsChatInterfaceOpen(true);
      } else if (assistantMode === 'voice_tour_paused_by_user') {
        addMessageToChat('ai', "The voice tour was paused. Would you like to ask a question, or perhaps I can help with something else?");
        setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "End Interaction", action: 'end_chat_interaction', icon: <Square className="mr-2 h-4 w-4" /> },
        ]);
         setAssistantMode('qa');
         setIsChatInterfaceOpen(true);
      } else { // Default: initiate greeting if tour hasn't started or was properly ended
        initiateGreeting();
      }
    }
  }, [
    isChatInterfaceOpen,
    assistantMode,
    voiceTourCompleted,
    startVoiceTourSignal,
    userRespondedToGreeting,
    addMessageToChat,
    initiateGreeting,
    setStopVoiceTourSignal,
    setStartVoiceTourSignal,
    setIsChatInterfaceOpen,
    setShowChatBubble,
    setChatQuickReplies,
    setAssistantMode,
    setChatMessages
  ]);

  useEffect(() => {
    if (!initialGreetingDoneRef.current && assistantMode === 'idle' && !isChatInterfaceOpen) {
      console.log("IntegratedAssistantController: Initial greeting useEffect triggered.");
      initiateGreeting();
      initialGreetingDoneRef.current = true; // Mark as done after initiating
    }
  }, [assistantMode, isChatInterfaceOpen, initiateGreeting]);


  useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement && (assistantMode === 'tour_declined_pending_scroll' || (assistantMode === 'idle' && userRespondedToGreeting && !voiceTourCompleted && !startVoiceTourSignal))) {
      contactSectionRef(contactElement);
    }
  }, [contactSectionRef, assistantMode, userRespondedToGreeting, voiceTourCompleted, startVoiceTourSignal]);


  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined. Opening chat for questions.");
      setChatMessages([]);
      addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setShowChatBubble(false);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true);
    }
  }, [contactSectionInView, assistantMode, hasShownScrolledToEndGreeting, addMessageToChat, isChatInterfaceOpen, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setAssistantMode, setShowChatBubble]);

  useEffect(() => {
    return () => {
      if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <ChatbotBubble
        onClick={mainBubbleClickHandler}
        isVisible={showChatBubble}
      />
      <InteractiveChatbot
        isOpen={isChatInterfaceOpen}
        mode={assistantMode} // Pass current mode
        initialMessages={chatMessages}
        initialQuickReplies={chatQuickReplies}
        onClose={mainBubbleClickHandler}
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
