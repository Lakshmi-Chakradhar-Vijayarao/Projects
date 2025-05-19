
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import type { ChatMessage as ChatbotMessageType, QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/ChatbotInterface'; // Renamed to avoid conflict
import { BotMessageSquare, CheckCircle, Download, MessageCircleQuestion, XCircle } from 'lucide-react';

type AssistantMode = 
  | 'idle'
  | 'greeting' 
  | 'voice_tour_active' 
  | 'voice_tour_paused' // if we implement pausing the voice tour itself
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

  const greetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.5,
  });

  // Attach ref to the actual contact section (needs to be done in Contact.tsx)
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
  }, []);

  const initiateGreeting = useCallback(() => {
    if (userRespondedToGreeting || voiceTourCompleted || assistantMode !== 'idle') return; 

    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setAssistantMode('greeting');
  }, [addMessageToChat, userRespondedToGreeting, voiceTourCompleted, assistantMode]);

  useEffect(() => {
    // Clear any existing timeout when dependencies change
    if (greetingTimeoutRef.current) {
      clearTimeout(greetingTimeoutRef.current);
    }
    // Set a new timeout only if the conditions are met
    if (!userRespondedToGreeting && assistantMode === 'idle' && !isChatInterfaceOpen) {
      greetingTimeoutRef.current = setTimeout(() => {
          initiateGreeting();
      }, 500); // Reduced delay to 0.5 seconds
    }
    return () => {
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
    };
  }, [initiateGreeting, userRespondedToGreeting, assistantMode, isChatInterfaceOpen]);


  const handleQuickReplyAction = useCallback((action: string) => {
    setUserRespondedToGreeting(true); 

    if (action === 'start_voice_tour') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setStartVoiceTourSignal(true);
      setStopVoiceTourSignal(false); 
      setAssistantMode('voice_tour_active');
      // Voice tour will manage hiding the bubble during its active presentation
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
  }, [addMessageToChat]);

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
  }, [addMessageToChat]);

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
  }, [contactSectionInView, assistantMode, userRespondedToGreeting, startVoiceTourSignal, voiceTourCompleted, hasShownScrolledToEndGreeting, addMessageToChat]);


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
      // If it was 'greeting', 'post_voice_tour_qa', or 'scrolled_to_end_greeting',
      // closing it effectively makes it 'idle' from the bubble's perspective.
      // The state will be re-evaluated if bubble is clicked again.
      if (assistantMode !== 'voice_tour_active') {
        setAssistantMode('idle');
      }
    } else { 
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);

      if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
        setAssistantMode('post_voice_tour_qa');
        // Avoid adding message if already present from tour completion
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
        // If they closed the "scrolled to end" greeting and clicked the bubble again
        addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
        setChatQuickReplies([
            { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
            { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      }
      else { 
        initiateGreeting();
      }
      setIsChatInterfaceOpen(true);
    }
  }, [isChatInterfaceOpen, assistantMode, userRespondedToGreeting, voiceTourCompleted, initiateGreeting, addMessageToChat, chatMessages]);
  
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
