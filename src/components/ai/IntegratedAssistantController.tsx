
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { BotMessageSquare, CheckCircle, Download, MessageCircleQuestion, XCircle } from 'lucide-react';

type AssistantMode = 
  | 'idle'
  | 'greeting' 
  | 'voice_tour_active' 
  | 'voice_tour_paused' // If user clicks bubble during voice tour
  | 'qa' 
  | 'post_voice_tour_qa'
  | 'scrolled_to_end_greeting';

const IntegratedAssistantController: React.FC = () => {
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false); // To explicitly stop voice tour
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);

  const contactSectionObserverRef = useRef<HTMLDivElement | null>(null);
  const { ref: contactSectionInViewRefCallback, inView: contactSectionInView } = useInView({
    threshold: 0.5,
  });

  // Assign the ref from useInView to the actual DOM element
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
  }, []); // setChatMessages is stable from useState

  const initiateGreeting = useCallback(() => {
    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setAssistantMode('greeting');
  }, [addMessageToChat, setChatQuickReplies, setIsChatInterfaceOpen, setAssistantMode]);

  useEffect(() => {
    if (!userRespondedToGreeting && assistantMode === 'idle' && !isChatInterfaceOpen && !startVoiceTourSignal && !voiceTourCompleted) {
      initiateGreeting();
    }
  }, [userRespondedToGreeting, assistantMode, isChatInterfaceOpen, startVoiceTourSignal, voiceTourCompleted, initiateGreeting]);


  const handleQuickReplyAction = useCallback((action: string) => {
    setUserRespondedToGreeting(true); 

    if (action === 'start_voice_tour') {
      setIsChatInterfaceOpen(false); // Close chat for voice tour
      setChatQuickReplies([]);
      setStartVoiceTourSignal(true);
      setStopVoiceTourSignal(false); 
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setAssistantMode('idle'); // User can re-engage by clicking bubble
    } else if (action === 'open_qa') {
      setAssistantMode('qa');
      addMessageToChat('ai', "Great! What would you like to know about Chakradhar?");
      setChatQuickReplies([]); 
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank'); // Assuming resume is in public folder
    } else if (action === 'end_chat_interaction') {
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      setAssistantMode('idle');
    }
  }, [addMessageToChat, setIsChatInterfaceOpen, setAssistantMode, setChatQuickReplies, setStartVoiceTourSignal, setUserRespondedToGreeting]);

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
  }, [addMessageToChat, setAssistantMode, setChatQuickReplies, setIsChatInterfaceOpen, setStartVoiceTourSignal, setVoiceTourCompleted]);

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
  }, [contactSectionInView, assistantMode, userRespondedToGreeting, startVoiceTourSignal, voiceTourCompleted, hasShownScrolledToEndGreeting, addMessageToChat, setChatQuickReplies, setAssistantMode, setIsChatInterfaceOpen, setHasShownScrolledToEndGreeting]);

  const mainBubbleClickHandler = useCallback(() => {
    if (isChatInterfaceOpen) { 
      // If chat is open, clicking bubble (or X in chat) should close it
      // If voice tour was active, it implies user wants to stop/interrupt it.
      if (assistantMode === 'voice_tour_active') {
        setStopVoiceTourSignal(true); // Signal ContentReader to stop
        setStartVoiceTourSignal(false); // Ensure tour doesn't restart if bubble clicked again quickly
        setAssistantMode('idle'); // Reset mode
      }
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]); 
      // Do not reset assistantMode if it was 'post_voice_tour_qa' or 'scrolled_to_end_greeting'
      // as user might want to re-open to that same context.
      // If it was 'greeting', it means they closed the initial popup; set to 'idle'.
      if (assistantMode === 'greeting' || assistantMode === 'qa') {
         setAssistantMode('idle'); 
      }
    } else { 
      // Chat is closed, clicking bubble should open it
      setStopVoiceTourSignal(false); // Ensure any stop signal is cleared if we are re-opening

      if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
        setAssistantMode('post_voice_tour_qa');
        // Avoid duplicate message if re-opening to the same context
        if (chatMessages.length === 0 || chatMessages[chatMessages.length -1]?.text !== "Welcome back! You've completed the tour. Still have questions about Chakradhar or want to download the resume?") {
           addMessageToChat('ai', "Welcome back! You've completed the tour. Still have questions about Chakradhar or want to download the resume?");
        }
         setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
          { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      } else if (assistantMode === 'scrolled_to_end_greeting') {
        // Re-show the scrolled-to-end greeting if bubble clicked again
        if (chatMessages.length === 0 || chatMessages[chatMessages.length -1]?.text !== "Thanks for exploring! Have any questions about Chakradhar's work or experience?") {
          addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
        }
        setChatQuickReplies([
            { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
            { text: "Not right now", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      } else if (userRespondedToGreeting && (assistantMode === 'idle' || assistantMode === 'qa')) { 
        // User has responded to greeting before, and is now re-engaging for QA
        setAssistantMode('qa');
        if (chatMessages.length === 0 || chatMessages[chatMessages.length -1]?.text !== "Hello again! What can I help you with regarding Chakradhar's profile?") {
           addMessageToChat('ai', "Hello again! What can I help you with regarding Chakradhar's profile?");
        }
        setChatQuickReplies([]); 
      } else { 
        // Default: Not greeted yet, or tour was interrupted and mode is 'idle'.
        // Trigger initial greeting logic.
        initiateGreeting(); // This will set mode to 'greeting' and set messages/replies
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
  
  // Show the bubble if the main chat interface is NOT open,
  // AND it's not the case that the voice tour is active AND the signal to start it is true (meaning it's auto-playing)
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

    