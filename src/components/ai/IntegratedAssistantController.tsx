
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BrainCircuit, BotMessageSquare, Play, Volume2, VolumeX } from 'lucide-react';

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
  // State declarations MUST come first
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [showChatBubble, setShowChatBubble] = useState(true); // Moved up
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState<string>('greeting'); // 'greeting' is the first step
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);

  // Ref declarations
  const initialGreetingDoneRef = useRef(false);
  const messageIdCounterRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isMountedRef = useRef(false);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For ContentReader's auto-advance

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Callback definitions
  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !text) {
      console.warn("IntegratedAssistantController: SpeakTextNow called prematurely or with no text.");
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: Attempting to speak: "${text.substring(0, 50)}..."`);

    // Cancel any speech currently managed by *this controller* or globally if it's a new primary speech action.
    if (synthRef.current.speaking || synthRef.current.pending) {
        console.log("IntegratedAssistantController: Cancelling existing speech before speaking new text via speakTextNow.");
        synthRef.current.cancel(); // This is a global cancel.
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0, 50)}..."`);
      if (onEnd) onEnd();
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error;
      }
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Full event object:", event);
      if (onEnd) onEnd(); 
    };
    synthRef.current.speak(utterance);
  }, []); // synthRef is stable after mount

  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    messageIdCounterRef.current += 1;
    const newMessage: ChatbotMessageType = {
      id: `${Date.now()}-${messageIdCounterRef.current}`,
      sender,
      text,
      timestamp: new Date(),
      speakableTextOverride,
    };
    console.log("IntegratedAssistantController: Adding message to chat:", newMessage);
    setChatMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, [setChatMessages]);

  const initiateGreeting = useCallback(() => {
    console.log("IntegratedAssistantController: Initiating greeting.");
    setChatInterfaceRenderKey(prev => prev + 1);
    setChatMessages([]); // Clear previous messages
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', greetingText, greetingText); // The useEffect watching chatMessages will speak this
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false);
  }, [addMessageToChat, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setUserRespondedToGreeting]);

  const handleProjectsStepInController = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader reached projects step. Opening chat for project selection.");
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(true); // Signal ContentReader to stop its own speech
    
    setChatInterfaceRenderKey(prev => prev + 1);
    setChatMessages(prev => prev.filter(msg => msg.id.startsWith('tour-') || msg.sender === 'user')); // Keep user messages and tour intro

    const projectIntroMsg = "Chakradhar has led and contributed to impactful projects. Here are the titles:";
    addMessageToChat('ai', projectIntroMsg, projectIntroMsg);

    const projectQuickReplies: ChatbotQuickReplyType[] = (ContentReader.sectionsToReadData_FOR_DETAILS_ONLY || [])
      .filter(section => section.categories?.includes("project_detail_button"))
      .map(project => ({
        text: project.title || "Unnamed Project",
        action: `project_detail_${project.id}`
      }));
    
    projectQuickReplies.push({ text: "Next Section (Education)", action: "next_section_education", icon: <Play className="mr-2 h-4 w-4" /> });
      
    setChatQuickReplies(projectQuickReplies);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('qa'); // Or a new 'project_selection' mode
    setCurrentTourStep('projects_list_intro');
  }, [addMessageToChat, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setChatMessages]);

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 
    setUserRespondedToGreeting(true); // General flag for any initial interaction
    initialGreetingDoneRef.current = true; // Also mark general greeting as fully processed.

    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', startMessage, startMessage); // Let message useEffect speak this
      speakTextNow(startMessage, () => { // Explicit speak for transition
        console.log("IntegratedAssistantController: 'Great! Starting...' speech finished. Closing chat, starting voice tour.");
        setTimeout(() => {
          setIsChatInterfaceOpen(false);
          setShowChatBubble(false); // Hide bubble during active voice tour
          setCurrentTourStep('about'); 
          setStartVoiceTourSignal(true);
          setStopVoiceTourSignal(false);
        }, 300); 
      });
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      const declineMessage = "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!";
      addMessageToChat('ai', declineMessage, declineMessage);
      speakTextNow(declineMessage);
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true);
      setAssistantMode('tour_declined_pending_scroll');
    } else if (action.startsWith('project_detail_')) {
      const projectSectionId = action.replace('project_detail_', '');
      const userClickedMsg = `Tell me about: ${projectSectionId.replace(/_/g, ' ')}`;
      addMessageToChat('user', userClickedMsg);
      
      const projectDetailSection = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(s => s.id === projectSectionId);
      const projectSpeakableText = projectDetailSection?.speakableText || `Details for ${projectSectionId.replace(/_/g, ' ')} would be shown here.`;
      addMessageToChat('ai', projectSpeakableText, projectSpeakableText); // Let message useEffect speak this
      speakTextNow(projectSpeakableText);

      // Re-show project quick replies
      const projectReplies: ChatbotQuickReplyType[] = (ContentReader.sectionsToReadData_FOR_DETAILS_ONLY || [])
        .filter(section => section.categories?.includes("project_detail_button"))
        .map(project => ({
          text: project.title || "Unnamed Project",
          action: `project_detail_${project.id}`
        }));
      projectReplies.push({ text: "Next Section (Education)", action: "next_section_education", icon: <Play className="mr-2 h-4 w-4" /> });
      setChatQuickReplies(projectReplies);

    } else if (action === 'next_section_education') {
      addMessageToChat('user', "Next Section (from Projects)");
      const nextMessage = "Okay, moving to Education.";
      addMessageToChat('ai', nextMessage, nextMessage);
      speakTextNow(nextMessage, () => {
        setTimeout(() => {
          setIsChatInterfaceOpen(false);
          setShowChatBubble(false); // Hide bubble during active voice tour
          setCurrentTourStep('education-section'); 
          setStartVoiceTourSignal(true);
          setStopVoiceTourSignal(false);
        }, 300);
      });
      setAssistantMode('voice_tour_active');
    } else if (action === 'open_qa') {
      setAssistantMode('qa');
      const qaMessage = "Great! What would you like to know about Chakradhar?";
      addMessageToChat('ai', qaMessage, qaMessage);
      speakTextNow(qaMessage);
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank'); // Ensure lakshmi_resume.pdf is in /public
      const downloadMessage = "The resume is being downloaded. Anything else I can help with?";
      addMessageToChat('ai', downloadMessage, downloadMessage);
      speakTextNow(downloadMessage);
      setChatQuickReplies([
        { text: "Ask another Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
    } else if (action === 'end_chat_interaction' || action === 'not_right_now_scrolled_end') {
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true);
      setAssistantMode('idle');
      setStopVoiceTourSignal(true);
      if(synthRef.current?.speaking) synthRef.current.cancel(); // Stop any controller speech
    }
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setCurrentTourStep, setChatQuickReplies, setUserRespondedToGreeting, setChatMessages]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    
    setChatInterfaceRenderKey(prev => prev + 1); // Force re-render of chat interface
    setChatMessages([]); // Clear messages for post-tour interaction

    const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to explore anything else?";
    addMessageToChat('ai', endMessage, endMessage); // Let message useEffect speak
    speakTextNow(endMessage); // Also explicitly speak for immediate feedback
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
  }, [addMessageToChat, speakTextNow, setStartVoiceTourSignal, setStopVoiceTourSignal, setVoiceTourCompleted, setAssistantMode, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble]);
  
  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    if(tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current); // Clear any auto-advance from ContentReader
    setStopVoiceTourSignal(true); // Signal ContentReader to stop if active
    if(synthRef.current?.speaking) synthRef.current.cancel(); // Stop controller's speech too

    if (isChatInterfaceOpen) {
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true);
        setChatQuickReplies([]);
        if (assistantMode === 'voice_tour_active') {
            setAssistantMode('voice_tour_paused_by_user');
            setStartVoiceTourSignal(false);
        } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
             setAssistantMode('tour_declined_pending_scroll');
        } else {
          setAssistantMode('idle'); 
        }
    } else { // Chat is closed, bubble was clicked
        setShowChatBubble(false);
        setChatInterfaceRenderKey(prev => prev + 1); // Force re-render chat interface
        setChatMessages([]); // Clear previous messages

        if (assistantMode === 'voice_tour_paused_by_user' || assistantMode === 'post_voice_tour_qa' || voiceTourCompleted) {
            const resumeMsg = "Welcome back! You can ask questions about Chakradhar's resume or download it.";
            addMessageToChat('ai', resumeMsg, resumeMsg);
            // speakTextNow(resumeMsg); // Let message useEffect handle speaking
            setChatQuickReplies([
              { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
              { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
              { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
            setAssistantMode('qa'); 
        } else if (assistantMode === 'scrolled_to_end_greeting' || (assistantMode === 'tour_declined_pending_scroll' && contactSectionInView) ) {
             const scrolledEndMsg = "Thanks for exploring! Have any questions about Chakradhar's work or experience?";
             addMessageToChat('ai', scrolledEndMsg, scrolledEndMsg);
            // speakTextNow(scrolledEndMsg); // Let message useEffect handle speaking
             setChatQuickReplies([
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
             setAssistantMode('scrolled_to_end_greeting'); // Ensure mode is set
        } else { // Default to re-greeting if no other specific state
            initialGreetingDoneRef.current = false; 
            initiateGreeting();
        }
        setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen, assistantMode, voiceTourCompleted, userRespondedToGreeting, contactSectionInView,
    addMessageToChat, initiateGreeting, setIsChatInterfaceOpen, setShowChatBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages // Added setChatMessages
  ]);
  
  // Effects
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const voices = synthRef.current.getVoices();
      if (voices.length === 0 && synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = () => {
          console.log("IntegratedAssistantController: Voices loaded via onvoiceschanged.");
        };
      } else if (voices.length > 0) {
        console.log("IntegratedAssistantController: Voices immediately available.");
      }
      console.log("IntegratedAssistantController: Speech synthesis initialized.");
    } else {
      console.warn("IntegratedAssistantController: Speech synthesis not supported.");
    }

    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactSectionRef(contactElement);
    }

    return () => {
      isMountedRef.current = false;
      if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        console.log("IntegratedAssistantController: Unmounting. Cancelling speech.");
        synthRef.current.cancel();
      }
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    };
  }, [contactSectionRef]);

  // Initial Greeting on Page Load
  useEffect(() => {
    if (isMountedRef.current && !initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: Checking initial greeting conditions...", { assistantMode, isChatInterfaceOpen, startVoiceTourSignal, voiceTourCompleted });
      // Ensure it's truly the initial idle state before greeting
      if (assistantMode === 'idle' && !isChatInterfaceOpen && !startVoiceTourSignal && !voiceTourCompleted) {
        console.log("IntegratedAssistantController: Conditions met. Calling initiateGreeting.");
        initiateGreeting();
        // initialGreetingDoneRef.current = true; // Moved inside initiateGreeting to ensure it's set after initiation
      }
    }
  }, [initiateGreeting, assistantMode, isChatInterfaceOpen, startVoiceTourSignal, voiceTourCompleted]);


  // Effect to speak AI messages when they are added (unless ContentReader is active)
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai' && lastMessage.speakableTextOverride && assistantMode !== 'voice_tour_active') {
      console.log("IntegratedAssistantController: useEffect speaking new AI message from chatMessages:", lastMessage.speakableTextOverride);
      speakTextNow(lastMessage.speakableTextOverride);
    }
  }, [chatMessages, speakTextNow, assistantMode]);


  // Scroll-to-end greeting
  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined. Opening chat for scrolled-to-end greeting.");
      setChatInterfaceRenderKey(prev => prev + 1);
      setChatMessages([]);
      const scrolledMsg = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions about his work or experience?";
      addMessageToChat('ai', scrolledMsg, scrolledMsg);
      // speakTextNow(scrolledMsg); // Let message useEffect speak
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setShowChatBubble(false);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true);
    }
  }, [
      contactSectionInView, assistantMode, hasShownScrolledToEndGreeting, isChatInterfaceOpen,
      addMessageToChat, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen,
      setShowChatBubble, setAssistantMode
  ]);

  return (
    <>
      <ChatbotBubble
        onClick={mainBubbleClickHandler}
        isVisible={showChatBubble}
      />
      <InteractiveChatbot
        key={chatInterfaceRenderKey}
        isOpen={isChatInterfaceOpen}
        mode={assistantMode}
        initialMessages={chatMessages}
        initialQuickReplies={chatQuickReplies}
        onClose={mainBubbleClickHandler}
        onQuickReplyAction={handleQuickReplyAction}
      />
      <ContentReader
        startTour={startVoiceTourSignal}
        stopTourSignal={stopVoiceTourSignal}
        onTourComplete={handleVoiceTourComplete}
        onProjectsStepReached={handleProjectsStepInController}
        initialSectionIndex={ // Map currentTourStep (string ID) to a numeric index
            ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.findIndex(s => s.id === currentTourStep) ?? 0
        }
        currentGlobalStepId={currentTourStep} // Pass the string ID directly
      />
    </>
  );
};

export default IntegratedAssistantController;

