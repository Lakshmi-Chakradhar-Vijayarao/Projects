
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
  | 'voice_tour_paused_by_user' // User clicked bubble/closed interface during voice tour
  | 'qa'
  | 'post_voice_tour_qa'
  | 'scrolled_to_end_greeting'
  | 'tour_declined_pending_scroll'; // State after declining tour, before scrolling to end

const IntegratedAssistantController: React.FC = () => {
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);

  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);

  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const initialGreetingDoneRef = useRef(false);
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.5,
    triggerOnce: false, // We want to check this even if user scrolls up and down
  });

 useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement && (assistantMode === 'tour_declined_pending_scroll' || assistantMode === 'idle' && userRespondedToGreeting && !voiceTourCompleted)) {
      contactSectionRef(contactElement);
    }
  }, [contactSectionRef, assistantMode, userRespondedToGreeting, voiceTourCompleted]);

  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date(),
      speakableTextOverride
    }]);
  }, [setChatMessages]);

  const initiateGreeting = useCallback(() => {
    setChatMessages([]);
    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); // User hasn't responded to *this* greeting instance yet
    initialGreetingDoneRef.current = true; // Mark greeting as initiated
  }, [addMessageToChat, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setAssistantMode, setUserRespondedToGreeting]);

  useEffect(() => {
    if (!initialGreetingDoneRef.current) {
      initiateGreeting();
    }
  }, [initiateGreeting]);


  const handleQuickReplyAction = useCallback((action: string) => {
    setUserRespondedToGreeting(true);
    setChatQuickReplies([]);

    if (action === 'start_voice_tour') {
      setIsChatInterfaceOpen(false);
      setStartVoiceTourSignal(true);
      setStopVoiceTourSignal(false);
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      setIsChatInterfaceOpen(false);
      setAssistantMode('tour_declined_pending_scroll'); // New state
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
      setAssistantMode('idle'); // Or a specific "chat_ended_by_user" state if needed
    }
  }, [addMessageToChat, setIsChatInterfaceOpen, setStartVoiceTourSignal, setStopVoiceTourSignal, setAssistantMode, setChatQuickReplies, setUserRespondedToGreeting]);

  const handleVoiceTourComplete = useCallback(() => {
    setStartVoiceTourSignal(false);
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
  }, [addMessageToChat, setStartVoiceTourSignal, setStopVoiceTourSignal, setVoiceTourCompleted, setAssistantMode, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen]);

  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting) {
      setChatMessages([]);
      addMessageToChat('ai', "Thanks for exploring! Have any questions about Chakradhar's work or experience?");
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true);
    }
  }, [contactSectionInView, assistantMode, hasShownScrolledToEndGreeting, addMessageToChat, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setAssistantMode]);


  const mainBubbleClickHandler = useCallback(() => {
    setStopVoiceTourSignal(true); // Always stop voice tour if bubble is clicked or interface is closed by 'X'

    if (isChatInterfaceOpen) { // Closing the interface
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]);
      if (assistantMode === 'greeting' && !userRespondedToGreeting) {
         setAssistantMode('tour_declined_pending_scroll'); // User closed initial greeting
         setUserRespondedToGreeting(true); // Treat as response to avoid re-greeting
      } else if (assistantMode === 'voice_tour_active') {
        setAssistantMode('voice_tour_paused_by_user');
      } else if (assistantMode === 'scrolled_to_end_greeting' || assistantMode === 'post_voice_tour_qa' || assistantMode === 'qa') {
        setAssistantMode('idle'); // Or a specific state like "chat_closed_by_user"
      } else {
        setAssistantMode('idle');
      }
    } else { // Opening the interface by clicking the bubble
      setStartVoiceTourSignal(false); // Ensure voice tour doesn't auto-restart
      setChatMessages([]);

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
            { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
      } else if (assistantMode === 'voice_tour_paused_by_user') {
        addMessageToChat('ai', "The voice tour is paused. Would you like to resume, ask a question, or end the tour?");
        setChatQuickReplies([
          // { text: "Resume Tour", action: 'start_voice_tour', icon: <Play className="mr-2 h-4 w-4" /> }, // Resuming tour can be complex, offer QA or end
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "End Tour", action: 'end_chat_interaction', icon: <Square className="mr-2 h-4 w-4" /> }, // Effectively ends tour, goes to idle
        ]);
      } else { // Default (e.g., 'idle', 'tour_declined_pending_scroll')
        // Re-initiate the greeting process
        initialGreetingDoneRef.current = false; // Allow greeting to re-trigger
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
    setStopVoiceTourSignal,
    setIsChatInterfaceOpen,
    setChatQuickReplies,
    setAssistantMode,
    setUserRespondedToGreeting,
    setStartVoiceTourSignal,
    setChatMessages
  ]);

  // Determine if the bubble should be shown
  // Show bubble if chat interface is NOT open AND (it's not the active voice tour OR the tour is paused)
  const showChatBubble = !isChatInterfaceOpen && 
                         !(assistantMode === 'voice_tour_active' && startVoiceTourSignal) &&
                         assistantMode !== 'greeting'; // Also hide bubble during initial greeting popup

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
        onClose={mainBubbleClickHandler} // Allows closing ChatInterface via its 'X' button
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

