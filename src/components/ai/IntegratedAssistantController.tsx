
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { BotMessageSquare, CheckCircle, Download, MessageCircleQuestion, XCircle, Play, Square } from 'lucide-react';

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
  
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false); // Tracks if user acted on the initial greeting
  const initialGreetingDoneRef = useRef(false); // Ensures initial greeting logic runs once

  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);

  const { ref: contactSectionInViewRefCallback, inView: contactSectionInView } = useInView({
    threshold: 0.5,
    triggerOnce: true, // Important: trigger only once when it comes into view
  });

  useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement) {
        contactSectionInViewRefCallback(contactElement);
    }
  }, [contactSectionInViewRefCallback]);


  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    setChatMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      sender, 
      text, 
      timestamp: new Date(),
      speakableTextOverride 
    }]);
  }, []);

  const initiateGreeting = useCallback(() => {
    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setAssistantMode('greeting');
    initialGreetingDoneRef.current = true; // Mark that greeting has been initiated
    setUserRespondedToGreeting(false); // Reset this until user actually responds
  }, [addMessageToChat, setChatQuickReplies, setIsChatInterfaceOpen, setAssistantMode]);

  // Effect for initial greeting on page load
  useEffect(() => {
    if (!initialGreetingDoneRef.current && assistantMode === 'idle' && !isChatInterfaceOpen) {
      initiateGreeting();
    }
  }, [assistantMode, isChatInterfaceOpen, initiateGreeting]);


  const handleQuickReplyAction = useCallback((action: string) => {
    setUserRespondedToGreeting(true); // User has now responded

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
  }, [addMessageToChat, setIsChatInterfaceOpen, setAssistantMode, setChatQuickReplies, setStartVoiceTourSignal, setUserRespondedToGreeting]);

  const handleVoiceTourComplete = useCallback(() => {
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    addMessageToChat('ai', "The guided tour is complete! Feel free to ask any questions you have about Chakradhar.");
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
  }, [addMessageToChat, setAssistantMode, setChatQuickReplies, setIsChatInterfaceOpen, setStartVoiceTourSignal, setVoiceTourCompleted]);

  // Effect for "No Thanks" and scroll to end
  useEffect(() => {
    if (contactSectionInView && userRespondedToGreeting && assistantMode === 'idle' && !startVoiceTourSignal && !voiceTourCompleted && !hasShownScrolledToEndGreeting) {
      addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true); 
    }
  }, [contactSectionInView, assistantMode, userRespondedToGreeting, startVoiceTourSignal, voiceTourCompleted, hasShownScrolledToEndGreeting, addMessageToChat, setChatQuickReplies, setAssistantMode, setIsChatInterfaceOpen, setHasShownScrolledToEndGreeting]);


  const mainBubbleClickHandler = useCallback(() => {
    if (isChatInterfaceOpen) { 
      if (assistantMode === 'voice_tour_active') {
        setStopVoiceTourSignal(true); 
        setStartVoiceTourSignal(false); 
        setAssistantMode('idle'); 
      }
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]); 
      if (assistantMode === 'greeting' || assistantMode === 'qa') {
         setAssistantMode('idle'); 
      }
    } else { 
      setStopVoiceTourSignal(false); 

      if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
        setAssistantMode('post_voice_tour_qa');
        if (chatMessages.length === 0 || chatMessages[chatMessages.length -1]?.text !== "Welcome back! You've completed the tour. Still have questions about Chakradhar or want to download the resume?") {
           addMessageToChat('ai', "Welcome back! You've completed the tour. Still have questions about Chakradhar or want to download the resume?");
        }
         setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
          { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      } else if (assistantMode === 'scrolled_to_end_greeting') {
        if (chatMessages.length === 0 || chatMessages[chatMessages.length -1]?.text !== "Thanks for exploring! Have any questions about Chakradhar's work or experience?") {
          addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
        }
        setChatQuickReplies([
            { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
            { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      } else if (userRespondedToGreeting && (assistantMode === 'idle' || assistantMode === 'qa')) { 
        setAssistantMode('qa');
        if (chatMessages.length === 0 || chatMessages[chatMessages.length -1]?.text !== "Hello again! What can I help you with regarding Chakradhar's profile?") {
           addMessageToChat('ai', "Hello again! What can I help you with regarding Chakradhar's profile?");
        }
        setChatQuickReplies([]); 
      } else { 
        // Default: Not greeted yet, or tour was interrupted and mode is 'idle'.
        // Trigger initial greeting logic.
        initiateGreeting(); 
      }
      setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen, 
    assistantMode, 
    voiceTourCompleted, 
    userRespondedToGreeting, 
    chatMessages, 
    addMessageToChat, 
    initiateGreeting, 
    setChatQuickReplies, 
    setAssistantMode, 
    setIsChatInterfaceOpen, 
    setStopVoiceTourSignal, 
    setStartVoiceTourSignal
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
