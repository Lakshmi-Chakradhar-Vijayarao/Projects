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
  | 'voice_tour_paused_by_user' // Renamed from voice_tour_paused
  | 'qa' 
  | 'post_voice_tour_qa'
  | 'scrolled_to_end_greeting';

const IntegratedAssistantController: React.FC = () => {
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false); // To explicitly stop ContentReader
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const initialGreetingDoneRef = useRef(false);

  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.5, // Trigger when 50% of the contact section is visible
    triggerOnce: false, // We want to re-check if user scrolls back up then down after declining
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
  }, []);

  const initiateGreeting = useCallback(() => {
    setChatMessages([]); // Clear previous messages
    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setAssistantMode('greeting');
    initialGreetingDoneRef.current = true;
    setUserRespondedToGreeting(false); // Reset until user clicks a button
  }, [addMessageToChat]);

  useEffect(() => {
    // Trigger initial greeting once when component mounts if conditions are met
    if (!initialGreetingDoneRef.current && assistantMode === 'idle' && !isChatInterfaceOpen) {
      initiateGreeting();
    }
  }, [assistantMode, isChatInterfaceOpen, initiateGreeting]);


  const handleQuickReplyAction = useCallback((action: string) => {
    setUserRespondedToGreeting(true); 

    if (action === 'start_voice_tour') {
      setIsChatInterfaceOpen(false); 
      setChatQuickReplies([]);
      setStartVoiceTourSignal(true); // Signal ContentReader to start
      setStopVoiceTourSignal(false); // Ensure stop signal is off
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setAssistantMode('idle'); 
      // User has declined, scroll-to-end logic will take over if they scroll
    } else if (action === 'open_qa') {
      setAssistantMode('qa');
      addMessageToChat('ai', "Great! What would you like to know about Chakradhar?");
      setChatQuickReplies([]); 
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank'); 
      // Keep chat open or offer further assistance? For now, just downloads.
    } else if (action === 'end_chat_interaction') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setAssistantMode('idle');
    }
  }, [addMessageToChat, setAssistantMode]);

  const handleVoiceTourComplete = useCallback(() => {
    setStartVoiceTourSignal(false); // Reset the start signal
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    setChatMessages([]); // Clear previous tour messages
    addMessageToChat('ai', "The guided tour is complete! Feel free to ask any questions you have about Chakradhar.");
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
  }, [addMessageToChat, setAssistantMode]);

  // Effect for "No Thanks" and scroll to end
  useEffect(() => {
    if (contactSectionInView && userRespondedToGreeting && assistantMode === 'idle' && !startVoiceTourSignal && !voiceTourCompleted && !hasShownScrolledToEndGreeting) {
      setChatMessages([]); // Clear previous messages if any
      addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true); 
    }
  }, [contactSectionInView, assistantMode, userRespondedToGreeting, startVoiceTourSignal, voiceTourCompleted, hasShownScrolledToEndGreeting, addMessageToChat, setAssistantMode]);

  // Main handler for bubble click OR closing the chat interface
  const mainBubbleClickHandler = useCallback(() => {
    setStopVoiceTourSignal(true); // Always stop voice tour if bubble is clicked or interface is closed

    if (isChatInterfaceOpen) { 
      // If interface is open, clicking means closing it
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]); 
      if (assistantMode === 'greeting' && !userRespondedToGreeting) {
        // If user closes the initial greeting without responding
        setAssistantMode('idle'); // Go to idle, bubble will reappear
        setUserRespondedToGreeting(true); // Mark as responded to avoid re-greeting immediately
      } else if (assistantMode === 'voice_tour_active') {
        setAssistantMode('voice_tour_paused_by_user'); // Or 'idle' if you prefer full stop
      }
    } else { 
      // If interface is closed, clicking bubble means opening it
      setStartVoiceTourSignal(false); // Ensure voice tour doesn't auto-restart

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
        // Offer to resume or ask questions if tour was paused
        addMessageToChat('ai', "The voice tour is paused. Would you like to resume or ask a question?");
         setChatQuickReplies([
            { text: "Resume Tour", action: 'start_voice_tour', icon: <Play className="mr-2 h-4 w-4" /> }, // Needs to resume from where it left off
            { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
            { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      }
      else { 
        // Default: Not greeted yet, or tour was declined. Re-initiate greeting.
        initiateGreeting(); 
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
    setAssistantMode,
    setUserRespondedToGreeting,
  ]);
  
  // Determine bubble visibility: show if chat is NOT open AND voice tour is NOT actively presenting
  const showChatBubble = !isChatInterfaceOpen && !(assistantMode === 'voice_tour_active' && startVoiceTourSignal);

  return (
    <>
      {/* The ChatbotBubble is the primary icon in the bottom-right corner */}
      <ChatbotBubble 
        onClick={mainBubbleClickHandler} 
        isVisible={showChatBubble} 
      />
      <InteractiveChatbot
        isOpen={isChatInterfaceOpen}
        mode={assistantMode} 
        // Pass current messages and quick replies
        initialMessages={chatMessages} 
        initialQuickReplies={chatQuickReplies} 
        // mainBubbleClickHandler is also used as onClose for the 'X' button in ChatInterface
        onClose={mainBubbleClickHandler} 
        onQuickReplyAction={handleQuickReplyAction}
      />
      <ContentReader 
        startTour={startVoiceTourSignal} 
        onTourComplete={handleVoiceTourComplete}
        stopTourSignal={stopVoiceTourSignal} // Propagate stop signal
      />
    </>
  );
};

export default IntegratedAssistantController;