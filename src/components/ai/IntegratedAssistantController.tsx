
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Play, Square, BrainCircuit, BotMessageSquare } from 'lucide-react';

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

  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false); // To explicitly stop ContentReader
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);

  const initialGreetingDoneRef = useRef(false);
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

 useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement && (assistantMode === 'tour_declined_pending_scroll' || (assistantMode === 'idle' && initialGreetingDoneRef.current && !voiceTourCompleted && !startVoiceTourSignal))) {
      contactSectionRef(contactElement);
    }
  }, [contactSectionRef, assistantMode, voiceTourCompleted, startVoiceTourSignal]);


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
    console.log("IntegratedAssistantController: Initiating greeting.");
    setChatMessages([]);
    addMessageToChat('ai', "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?");
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setAssistantMode('greeting');
    initialGreetingDoneRef.current = true;
  }, [addMessageToChat]);

  useEffect(() => {
    if (!initialGreetingDoneRef.current) {
       console.log("IntegratedAssistantController: Initial greeting effect triggered.");
       initiateGreeting();
    }
  }, [initiateGreeting]);


  const handleQuickReplyAction = useCallback((action: string) => {
    setChatQuickReplies([]); // Clear quick replies after an action

    if (action === 'start_voice_tour') {
      console.log("IntegratedAssistantController: User chose 'Yes, Guide Me'. Starting voice tour signal.");
      addMessageToChat('user', "Yes, Guide Me");
      addMessageToChat('ai', "Great! Starting the guided audio tour now. Please listen as I walk you through Chakradhar's portfolio sections.");
      setIsChatInterfaceOpen(false); // Close chat interface
      setStartVoiceTourSignal(true);
      setStopVoiceTourSignal(false);
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      console.log("IntegratedAssistantController: User chose 'No, Thanks'.");
      addMessageToChat('user', "No, Thanks");
      addMessageToChat('ai', "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!");
      setIsChatInterfaceOpen(false);
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
      setAssistantMode('idle');
    }
  }, [addMessageToChat, setAssistantMode, setIsChatInterfaceOpen, setStartVoiceTourSignal, setStopVoiceTourSignal]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed.");
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false); // Ensure stop signal is reset
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    setChatMessages([]); // Clear previous tour messages
    addMessageToChat('ai', "The guided audio tour is complete! Feel free to ask any questions you have about Chakradhar using the chat, or download his resume.");
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
  }, [addMessageToChat, setAssistantMode, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setStartVoiceTourSignal, setStopVoiceTourSignal, setVoiceTourCompleted]);

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
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true);
    }
  }, [contactSectionInView, assistantMode, hasShownScrolledToEndGreeting, addMessageToChat, isChatInterfaceOpen]);


  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    // If voice tour is active, clicking bubble or closing chat should stop it.
    if (assistantMode === 'voice_tour_active' || startVoiceTourSignal) {
        console.log("IntegratedAssistantController: Stopping voice tour due to bubble/close click.");
        setStopVoiceTourSignal(true); // Signal ContentReader to stop
        setStartVoiceTourSignal(false); // Ensure tour doesn't restart
    }

    if (isChatInterfaceOpen) { // Closing the interface
      setIsChatInterfaceOpen(false);
      setChatQuickReplies([]); // Clear quick replies when chat closes
      if (assistantMode === 'greeting' && !initialGreetingDoneRef.current) { // Check ref for initial greeting
         setAssistantMode('tour_declined_pending_scroll'); 
      } else if (assistantMode === 'voice_tour_active') {
        setAssistantMode('voice_tour_paused_by_user');
      } else {
        setAssistantMode('idle');
      }
    } else { // Opening the interface by clicking the bubble
      setChatMessages([]); // Clear messages for a fresh interaction
      setStopVoiceTourSignal(false); // Reset stop signal if opening chat

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
        addMessageToChat('ai', "The voice tour was paused. Would you like to ask a question, or perhaps I can help with something else?");
        setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          // Option to restart tour could be added here if desired
          { text: "End Interaction", action: 'end_chat_interaction', icon: <Square className="mr-2 h-4 w-4" /> },
        ]);
         setAssistantMode('qa'); // Transition to general QA after acknowledging pause
      } else { // Default (e.g., 'idle', 'tour_declined_pending_scroll', or user re-clicked bubble after initial decline)
        // Re-initiate the greeting process
        initialGreetingDoneRef.current = false; // Allow greeting to re-trigger if necessary
        initiateGreeting();
      }
      setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen,
    assistantMode,
    voiceTourCompleted,
    startVoiceTourSignal, // Added this dependency
    addMessageToChat,
    initiateGreeting,
    setStopVoiceTourSignal,
    setIsChatInterfaceOpen,
    setChatQuickReplies,
    setAssistantMode,
    setStartVoiceTourSignal,
    setChatMessages
  ]);

  const showChatBubble = !isChatInterfaceOpen && assistantMode !== 'voice_tour_active';

  return (
    <>
      <ChatbotBubble
        onClick={mainBubbleClickHandler}
        isVisible={showChatBubble}
      />
      <InteractiveChatbot
        isOpen={isChatInterfaceOpen}
        mode={assistantMode} // Pass current assistant mode
        initialMessages={chatMessages}
        initialQuickReplies={chatQuickReplies}
        onClose={mainBubbleClickHandler}
        onQuickReplyAction={handleQuickReplyAction}
        // onSendMessageToAI prop will be used later for true text input
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
