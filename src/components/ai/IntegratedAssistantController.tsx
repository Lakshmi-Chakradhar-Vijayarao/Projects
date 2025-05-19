
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import type { ChatMessage, QuickReply } from '@/components/chatbot/ChatbotInterface';
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<QuickReply[]>([]);
  
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
      speakableTextOverride // This might not be used by InteractiveChatbot directly but good to have if needed
    }]);
  }, []);

  const initiateGreeting = useCallback(() => {
    if (userRespondedToGreeting || voiceTourCompleted) return; // Don't re-greet if already interacted or tour done

    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setAssistantMode('greeting');
  }, [addMessageToChat, userRespondedToGreeting, voiceTourCompleted]);

  useEffect(() => {
    greetingTimeoutRef.current = setTimeout(() => {
      if (!userRespondedToGreeting && assistantMode === 'idle') {
        initiateGreeting();
      }
    }, 1500);
    return () => {
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
    };
  }, [initiateGreeting, userRespondedToGreeting, assistantMode]);


  const handleQuickReplyAction = useCallback((action: string) => {
    setUserRespondedToGreeting(true); // Mark that user has responded to initial greeting

    if (action === 'start_voice_tour') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setStartVoiceTourSignal(true);
      setStopVoiceTourSignal(false); // Ensure stop signal is reset
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setAssistantMode('idle'); // User declined, go back to idle, bubble will be visible
    } else if (action === 'open_qa') {
      setAssistantMode('qa');
      addMessageToChat('ai', "Great! What would you like to know about Chakradhar?");
      setChatQuickReplies([]); // Clear quick replies for free-form Q&A
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank');
      // Optionally, keep chat open or close it
      // setIsChatInterfaceOpen(false); 
      // setAssistantMode('idle');
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

  // Handle user scrolling to the end after declining the tour
  useEffect(() => {
    if (contactSectionInView && assistantMode === 'idle' && userRespondedToGreeting && !startVoiceTourSignal && !voiceTourCompleted && !hasShownScrolledToEndGreeting) {
      addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true); // Ensure this only happens once
    }
  }, [contactSectionInView, assistantMode, userRespondedToGreeting, startVoiceTourSignal, voiceTourCompleted, hasShownScrolledToEndGreeting, addMessageToChat]);


  const handleBubbleOrCloseClick = useCallback(() => {
    if (isChatInterfaceOpen) { // Closing the chat interface
      if (assistantMode === 'voice_tour_active') {
        setStopVoiceTourSignal(true); // Signal ContentReader to stop
      }
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]); // Clear replies when closing
      if (assistantMode !== 'voice_tour_active' && assistantMode !== 'post_voice_tour_qa' && assistantMode !== 'scrolled_to_end_greeting') {
        setAssistantMode('idle');
      } else if (assistantMode === 'voice_tour_active'){
         // If voice tour was active, and user closes chat, what should happen?
         // For now, let's assume it stops the tour and goes idle.
         setAssistantMode('idle');
      }
    } else { // Opening the chat interface via bubble
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);

      if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
        setAssistantMode('post_voice_tour_qa');
        addMessageToChat('ai', "Welcome back! You've completed the tour. Still have questions about Chakradhar or want to download the resume?");
         setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
          { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      } else if (userRespondedToGreeting && assistantMode === 'idle') { // User declined tour, now clicks bubble
        setAssistantMode('qa');
        addMessageToChat('ai', "Hello again! What can I help you with regarding Chakradhar's profile?");
        setChatQuickReplies([]); // For free-form Q&A
      } else { // Default: initial greeting
        initiateGreeting();
      }
      setIsChatInterfaceOpen(true);
    }
  }, [isChatInterfaceOpen, assistantMode, userRespondedToGreeting, voiceTourCompleted, initiateGreeting, addMessageToChat]);
  
  // Prop to determine if bubble should be visible
  // Bubble is hidden if chat interface is open OR if voice tour is actively auto-playing
  const showChatBubble = !isChatInterfaceOpen && !(assistantMode === 'voice_tour_active' && startVoiceTourSignal);

  return (
    <>
      <ChatbotBubble 
        onClick={handleBubbleOrCloseClick} 
        isVisible={showChatBubble} 
      />
      <InteractiveChatbot
        isOpen={isChatInterfaceOpen}
        mode={assistantMode} // Pass current mode
        initialMessages={chatMessages} // Pass messages
        initialQuickReplies={chatQuickReplies} // Pass quick replies
        onClose={handleBubbleOrCloseClick} // Use the same handler for closing
        onQuickReplyAction={handleQuickReplyAction}
        // onSendMessageToAI prop will be handled by InteractiveChatbot itself
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

    