
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot'; // Ensure InteractiveChatbot exports these types
import ContentReader from '@/components/ai/ContentReader';
import { BotMessageSquare, CheckCircle, Download, MessageCircleQuestion, XCircle } from 'lucide-react';

type AssistantMode = 
  | 'idle'
  | 'greeting' 
  | 'voice_tour_active' 
  | 'voice_tour_paused'
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
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);

  // Removed greetingTimeoutRef as greeting is now immediate

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    const contactSectionElement = document.getElementById('contact');
    if (contactSectionElement && contactSectionRef) {
      (contactSectionRef as (node?: Element | null | undefined) => void)(contactSectionElement);
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
  }, []); // setChatMessages is stable from useState

  const initiateGreeting = useCallback(() => {
    // Conditions to NOT greet are effectively handled by the calling useEffect
    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setAssistantMode('greeting');
  }, [addMessageToChat, setChatQuickReplies, setIsChatInterfaceOpen, setAssistantMode]);

  // Effect for initial greeting on page load
  useEffect(() => {
    // Initiate greeting immediately if conditions are met.
    // This effect runs on mount and if its dependencies change.
    // The conditions ensure it only calls initiateGreeting when appropriate.
    if (!userRespondedToGreeting && assistantMode === 'idle' && !isChatInterfaceOpen && !startVoiceTourSignal && !voiceTourCompleted) {
      initiateGreeting();
    }
  }, [userRespondedToGreeting, assistantMode, isChatInterfaceOpen, startVoiceTourSignal, voiceTourCompleted, initiateGreeting]);


  const handleQuickReplyAction = useCallback((action: string) => {
    setUserRespondedToGreeting(true); 

    if (action === 'start_voice_tour') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setStartVoiceTourSignal(true);
      setStopVoiceTourSignal(false); 
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setAssistantMode('idle'); 
    } else if (action === 'open_qa') {
      setAssistantMode('qa');
      addMessageToChat('ai', "Great! What would you like to know about Chakradhar?");
      setChatQuickReplies([]); 
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank');
    } else if (action === 'end_chat_interaction') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setAssistantMode('idle');
    }
  }, [addMessageToChat, setIsChatInterfaceOpen, setAssistantMode, setChatQuickReplies, setStartVoiceTourSignal]);

  const handleVoiceTourComplete = useCallback(() => {
    setStartVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    addMessageToChat('ai', "The guided tour is complete! Feel free to ask any questions you have about Chakradhar.");
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
  }, [addMessageToChat, setAssistantMode, setChatQuickReplies, setIsChatInterfaceOpen]);

  useEffect(() => {
    if (contactSectionInView && assistantMode === 'idle' && userRespondedToGreeting && !startVoiceTourSignal && !voiceTourCompleted && !hasShownScrolledToEndGreeting) {
      addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true); 
    }
  }, [contactSectionInView, assistantMode, userRespondedToGreeting, startVoiceTourSignal, voiceTourCompleted, hasShownScrolledToEndGreeting, addMessageToChat, setChatQuickReplies, setAssistantMode, setIsChatInterfaceOpen]);

  const mainBubbleClickHandler = useCallback(() => {
    if (isChatInterfaceOpen) { 
      if (assistantMode === 'voice_tour_active') {
        setStopVoiceTourSignal(true); 
      }
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]); 
      if (assistantMode === 'voice_tour_active') {
         setAssistantMode('idle'); 
      }
      if (assistantMode !== 'voice_tour_active') {
        setAssistantMode('idle');
      }
    } else { 
      // No greeting timeout to clear anymore

      if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
        setAssistantMode('post_voice_tour_qa');
        if (chatMessages[chatMessages.length -1]?.text !== "Welcome back! You've completed the tour. Still have questions about Chakradhar or want to download the resume?") {
           addMessageToChat('ai', "Welcome back! You've completed the tour. Still have questions about Chakradhar or want to download the resume?");
        }
         setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
          { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      } else if (userRespondedToGreeting && assistantMode === 'idle') { 
        setAssistantMode('qa');
        addMessageToChat('ai', "Hello again! What can I help you with regarding Chakradhar's profile?");
        setChatQuickReplies([]); 
      } else if (assistantMode === 'scrolled_to_end_greeting') {
        addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
        setChatQuickReplies([
            { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
            { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      }
      else { // Default to initial greeting if no other state matches
        // Need to ensure initiateGreeting is called here IF appropriate
        // This branch is now for when the bubble is clicked and no specific state (postTour, QA, scrolledToEnd) is active
        // It should re-trigger the initial greeting logic.
        if (!userRespondedToGreeting && assistantMode === 'idle' && !startVoiceTourSignal && !voiceTourCompleted) {
            initiateGreeting();
        } else if (assistantMode === 'idle') { // Fallback if user has responded but no other mode is active
            setAssistantMode('qa');
            addMessageToChat('ai', "Hello again! What can I help you with regarding Chakradhar's profile?");
            setChatQuickReplies([]);
        }
      }
      setIsChatInterfaceOpen(true);
    }
  }, [isChatInterfaceOpen, assistantMode, userRespondedToGreeting, voiceTourCompleted, initiateGreeting, addMessageToChat, chatMessages, setChatQuickReplies, setAssistantMode, setIsChatInterfaceOpen, startVoiceTourSignal, setStopVoiceTourSignal]);
  
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
        onClose={mainBubbleClickHandler} // mainBubbleClickHandler handles closing
        onQuickReplyAction={handleQuickReplyAction}
        // onSendMessageToAI prop is needed if InteractiveChatbot handles sending messages to Genkit
        // For now, IntegratedAssistantController does not seem to directly call a Genkit QA flow itself,
        // rather it prepares the chat interface for QA mode. The actual call to Genkit
        // happens within InteractiveChatbot.tsx.
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

    