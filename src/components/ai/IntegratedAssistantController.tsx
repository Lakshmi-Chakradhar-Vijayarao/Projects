
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Play, Square } from 'lucide-react';

type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused_by_user'
  | 'qa'
  | 'post_voice_tour_qa'
  | 'scrolled_to_end_greeting';

const IntegratedAssistantController: React.FC = () => {
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);

  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);

  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const initialGreetingDoneRef = useRef(false); // Ensures greeting happens only once

  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactSectionRef(contactElement);
    }
  }, [contactSectionRef]);

  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date(),
      speakableTextOverride
    }]);
  }, []); // setChatMessages is stable

  const initiateGreeting = useCallback(() => {
    setChatMessages([]);
    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); // User hasn't responded to this specific greeting instance yet
  }, [addMessageToChat]); // Dependencies: stable setters, stable addMessageToChat

  // Effect for initial greeting on page load
  useEffect(() => {
    if (!initialGreetingDoneRef.current) {
      initiateGreeting();
      initialGreetingDoneRef.current = true; // Mark as done immediately after initiating
    }
  }, [initiateGreeting]); // initiateGreeting is stable

  const handleQuickReplyAction = useCallback((action: string) => {
    setUserRespondedToGreeting(true);
    setChatQuickReplies([]); // Clear quick replies after one is clicked

    if (action === 'start_voice_tour') {
      setIsChatInterfaceOpen(false);
      setStartVoiceTourSignal(true);
      setStopVoiceTourSignal(false);
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      setIsChatInterfaceOpen(false);
      setAssistantMode('idle');
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
    } else if (action === 'end_chat_interaction') {
      setIsChatInterfaceOpen(false);
      setAssistantMode('idle');
    }
  }, [addMessageToChat]);

  const handleVoiceTourComplete = useCallback(() => {
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    setChatMessages([]);
    addMessageToChat('ai', "The guided tour is complete! Feel free to ask any questions you have about Chakradhar.");
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
  }, [addMessageToChat]);

  useEffect(() => {
    if (contactSectionInView && userRespondedToGreeting && assistantMode === 'idle' && !startVoiceTourSignal && !voiceTourCompleted && !hasShownScrolledToEndGreeting) {
      setChatMessages([]);
      addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true);
    }
  }, [contactSectionInView, assistantMode, userRespondedToGreeting, startVoiceTourSignal, voiceTourCompleted, hasShownScrolledToEndGreeting, addMessageToChat]);

  const mainBubbleClickHandler = useCallback(() => {
    setStopVoiceTourSignal(true); // Always stop voice tour if bubble is clicked or interface is closed

    if (isChatInterfaceOpen) {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      if (assistantMode === 'greeting' && !userRespondedToGreeting) {
        setAssistantMode('idle');
        setUserRespondedToGreeting(true); // Avoid immediate re-greeting
      } else if (assistantMode === 'voice_tour_active') {
        setAssistantMode('voice_tour_paused_by_user');
      } else {
        setAssistantMode('idle'); // Default to idle if chat is closed
      }
    } else {
      setStartVoiceTourSignal(false); // Ensure voice tour doesn't auto-restart
      setChatMessages([]); // Clear messages for a fresh interaction

      if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
        setAssistantMode('post_voice_tour_qa');
        addMessageToChat('ai', "Welcome back! You've completed the tour. Still have questions about Chakradhar or want to download the resume?");
        setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
          { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      } else if (assistantMode === 'scrolled_to_end_greeting') {
         addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
         setChatQuickReplies([
            { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
            { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      } else if (assistantMode === 'voice_tour_paused_by_user') {
        addMessageToChat('ai', "The voice tour is paused. Would you like to resume, ask a question, or end the tour?");
        setChatQuickReplies([
          // { text: "Resume Tour", action: 'start_voice_tour', icon: <Play className="mr-2 h-4 w-4" /> }, // Resume logic needs more state
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "End Tour", action: 'end_chat_interaction', icon: <Square className="mr-2 h-4 w-4" /> },
        ]);
      } else { // Default (idle, or tour declined and not scrolled to end yet)
        initiateGreeting(); // Re-initiate the full greeting process
        initialGreetingDoneRef.current = false; // Allow greeting to re-trigger if conditions align
      }
      setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen,
    assistantMode,
    voiceTourCompleted,
    userRespondedToGreeting,
    addMessageToChat,
    initiateGreeting,
  ]);

  const showChatBubble = !isChatInterfaceOpen && !(assistantMode === 'voice_tour_active' && startVoiceTourSignal);

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
