
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
  | 'voice_tour_paused_by_user' // When user closes chat interface during voice tour
  | 'qa' // General Q&A mode
  | 'post_voice_tour_qa' // Q&A after voice tour completion
  | 'scrolled_to_end_greeting' // Greeting when user scrolls to end after declining tour
  | 'tour_declined_pending_scroll'; // State after declining tour, before scrolling to end

const IntegratedAssistantController: React.FC = () => {
  // State declarations MUST come first
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [showChatBubble, setShowChatBubble] = useState(true); 
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState<string>('greeting'); 
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);

  // Ref declarations
  const initialGreetingDoneRef = useRef(false);
  const messageIdCounterRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null); // For controller's own speech
  const isMountedRef = useRef(false);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false, 
  });

  // Callback definitions
  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !text) {
      console.warn("IntegratedAssistantController: SpeakTextNow conditions not met or text empty.", { isMounted: isMountedRef.current, synth: !!synthRef.current, text });
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: Attempting to speak: "${text.substring(0, 50)}..."`);

    // Clear handlers of any *currently tracked* controller utterance before cancelling.
    if (controllerUtteranceRef.current) {
      console.log("IntegratedAssistantController: Clearing handlers from previous controller utterance.");
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    
    if (synthRef.current.speaking || synthRef.current.pending) {
        console.log("IntegratedAssistantController: synth.speaking or .pending is true. Calling synth.cancel().");
        synthRef.current.cancel(); // Global cancel for anything in the synth's queue
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance; // Track the new utterance

    utterance.onend = () => {
      console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0, 50)}..." (Utterance matched: ${controllerUtteranceRef.current === utterance})`);
      if (controllerUtteranceRef.current === utterance) { 
        controllerUtteranceRef.current = null; 
        if (onEnd) onEnd();
      } else {
        console.log("IntegratedAssistantController: onEnd called for a stale/mismatched controller utterance.");
      }
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error; // This should be the error string like 'interrupted', 'canceled', etc.
      }
      // Log more specific error details
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current = null;
          if (onEnd) onEnd(); 
      } else {
        console.log("IntegratedAssistantController: onError called for a stale/mismatched controller utterance.");
      }
    };
    
    synthRef.current.speak(utterance);
  }, []); // Dependencies: synthRef and isMountedRef are stable after mount. addMessageToChat is memoized.

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
  }, []); // setChatMessages is stable

  const initiateGreeting = useCallback(() => {
    console.log("IntegratedAssistantController: Initiating greeting.");
    if (initialGreetingDoneRef.current) {
        console.log("IntegratedAssistantController: Greeting already initiated, skipping.");
        return;
    }
    setChatInterfaceRenderKey(prev => prev + 1);
    setChatMessages([]); 
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', greetingText, greetingText);
    speakTextNow(greetingText); // Speak the greeting
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); 
    // initialGreetingDoneRef.current = true; // Set this in handleQuickReplyAction or if user closes greeting
  }, [addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setUserRespondedToGreeting]);


  const handleProjectsStepInController = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader reached projects step. Opening chat for project selection.");
    setStartVoiceTourSignal(false); // Stop ContentReader's auto-advance
    setStopVoiceTourSignal(true); // Signal ContentReader to stop its own current speech if any

    setChatInterfaceRenderKey(prev => prev + 1);
    // Filter messages to keep user's previous messages and context if desired, or clear for new interaction
    // For now, let's start fresh for project selection to avoid clutter
    setChatMessages([]);

    const projectIntroMsg = "Chakradhar has led and contributed to impactful projects. Here are the titles:";
    const projectIntroMsgNode = (
        <p>{projectIntroMsg}</p>
    );
    addMessageToChat('ai', projectIntroMsgNode, projectIntroMsg);
    speakTextNow(projectIntroMsg);

    const projectQuickReplies: ChatbotQuickReplyType[] = (ContentReader.sectionsToReadData_FOR_DETAILS_ONLY || [])
      .filter(section => section.categories?.includes("project_detail_button")) // Ensure categories exist
      .map(project => ({
        text: project.title || "Unnamed Project", // Ensure title exists
        action: `project_detail_${project.id}`
      }));
    
    projectQuickReplies.push({ text: "Next Section (Education)", action: "next_section_education", icon: <Play className="mr-2 h-4 w-4" /> });
      
    setChatQuickReplies(projectQuickReplies);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('qa'); // Or a 'project_selection' mode
    setCurrentTourStep('projects_list_intro'); // Update controller's idea of the step
  }, [addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setStartVoiceTourSignal, setStopVoiceTourSignal]);

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 
    setUserRespondedToGreeting(true); 
    initialGreetingDoneRef.current = true;


    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', startMessage, startMessage); 
      speakTextNow(startMessage, () => { 
        console.log("IntegratedAssistantController: 'Great! Starting...' speech finished. Closing chat, starting voice tour.");
        setTimeout(() => {
          setIsChatInterfaceOpen(false);
          setShowChatBubble(false); 
          setCurrentTourStep('about'); 
          setStartVoiceTourSignal(true);
          setStopVoiceTourSignal(false);
          setAssistantMode('voice_tour_active');
        }, 200); // Short delay to ensure speech finishes before ContentReader might start
      });
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
      const project = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(s => s.id === projectSectionId);
      const userClickedMsg = `Tell me about: ${project?.title || projectSectionId.replace(/_/g, ' ')}`;
      addMessageToChat('user', userClickedMsg);
      
      const projectSpeakableText = project?.speakableText || `Details for ${project?.title || projectSectionId.replace(/_/g, ' ')} would be shown here.`;
      addMessageToChat('ai', projectSpeakableText, projectSpeakableText);
      speakTextNow(projectSpeakableText);

      const projectReplies: ChatbotQuickReplyType[] = (ContentReader.sectionsToReadData_FOR_DETAILS_ONLY || [])
        .filter(section => section.categories?.includes("project_detail_button"))
        .map(proj => ({
          text: proj.title || "Unnamed Project",
          action: `project_detail_${proj.id}`
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
          setShowChatBubble(false); 
          setCurrentTourStep('education-section'); 
          setStartVoiceTourSignal(true);
          setStopVoiceTourSignal(false);
          setAssistantMode('voice_tour_active');
        }, 200);
      });
    } else if (action === 'open_qa') {
      setChatMessages([]); // Clear previous messages for a fresh Q&A
      setAssistantMode('qa');
      const qaMessage = "Great! What would you like to know about Chakradhar?";
      addMessageToChat('ai', qaMessage, qaMessage);
      speakTextNow(qaMessage);
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank');
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
      if(synthRef.current?.speaking) synthRef.current.cancel();
    }
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setCurrentTourStep, setChatQuickReplies, setUserRespondedToGreeting, setChatMessages]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false); 
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    
    setChatInterfaceRenderKey(prev => prev + 1); 
    setChatMessages([]); 

    const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to explore anything else?";
    addMessageToChat('ai', endMessage, endMessage); 
    speakTextNow(endMessage); 
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
    
    if(tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    setStopVoiceTourSignal(true); 
    if(synthRef.current?.speaking) synthRef.current.cancel(); 

    if (isChatInterfaceOpen) {
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true);
        setChatQuickReplies([]);
        if (assistantMode === 'voice_tour_active') {
            setAssistantMode('voice_tour_paused_by_user');
            setStartVoiceTourSignal(false); // Stop voice tour signal
        } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
             setAssistantMode('tour_declined_pending_scroll');
        } else {
          setAssistantMode('idle'); 
        }
    } else { 
        setShowChatBubble(false);
        setChatInterfaceRenderKey(prev => prev + 1);
        setChatMessages([]);

        if (assistantMode === 'voice_tour_paused_by_user') {
             const resumeMsg = "The voice tour is paused. Would you like to resume, ask a question, or download the resume?";
             addMessageToChat('ai', resumeMsg, resumeMsg);
             setChatQuickReplies([
                { text: "Resume Tour", action: 'resume_voice_tour', icon: <Play className="mr-2 h-4 w-4" /> },
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
                { text: "End Interaction", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
             ]);
             // Assistant mode remains 'voice_tour_paused_by_user' until an action is taken
        } else if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
            const postTourMsg = "Welcome back! The guided tour is complete. You can ask questions or download the resume.";
            addMessageToChat('ai', postTourMsg, postTourMsg);
            setChatQuickReplies([
              { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
              { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
              { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
            setAssistantMode('qa'); 
        } else if (assistantMode === 'scrolled_to_end_greeting' || (assistantMode === 'tour_declined_pending_scroll' && contactSectionInView) ) {
             const scrolledEndMsg = "Thanks for exploring! Have any questions about Chakradhar's work or experience?";
             addMessageToChat('ai', scrolledEndMsg, scrolledEndMsg);
             setChatQuickReplies([
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
             setAssistantMode('scrolled_to_end_greeting'); 
        } else { 
            initialGreetingDoneRef.current = false; // Allow re-greeting if idle and no prior interaction
            initiateGreeting();
        }
        setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen, assistantMode, voiceTourCompleted, userRespondedToGreeting, contactSectionInView,
    addMessageToChat, initiateGreeting, setIsChatInterfaceOpen, setShowChatBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages
  ]);
  
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      // Ensure voices are loaded (some browsers need this)
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices();
        if (voices && voices.length > 0) {
          console.log("IntegratedAssistantController: Voices loaded.", voices.length);
           synthRef.current.onvoiceschanged = null; // Remove listener once voices are loaded
        }
      };
      if (synthRef.current.getVoices().length === 0) {
        synthRef.current.onvoiceschanged = loadVoices;
      } else {
        loadVoices(); // Voices might already be available
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
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        console.log("IntegratedAssistantController: Unmounting. Cancelling speech.");
        synthRef.current.cancel();
      }
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    };
  }, [contactSectionRef]);

  // Initial Greeting on Page Load
  useEffect(() => {
    if (isMountedRef.current && !initialGreetingDoneRef.current && assistantMode === 'idle' && !isChatInterfaceOpen) {
        console.log("IntegratedAssistantController: Conditions met for initial greeting. Calling initiateGreeting.");
        initiateGreeting();
        // initialGreetingDoneRef.current = true; // Moved to handleQuickReplyAction
    }
  }, [initiateGreeting, assistantMode, isChatInterfaceOpen]); 

  // Scroll-to-end greeting
  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined. Opening chat for scrolled-to-end greeting.");
      setChatInterfaceRenderKey(prev => prev + 1);
      setChatMessages([]);
      const scrolledMsg = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions about his work or experience?";
      addMessageToChat('ai', scrolledMsg, scrolledMsg);
      speakTextNow(scrolledMsg);
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
      addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen,
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
        mode={assistantMode} // Pass current assistant mode
        initialMessages={chatMessages}
        initialQuickReplies={chatQuickReplies}
        onClose={mainBubbleClickHandler} // Allow closing via interface's 'X'
        onQuickReplyAction={handleQuickReplyAction}
      />
      <ContentReader
        startTour={startVoiceTourSignal}
        stopTourSignal={stopVoiceTourSignal}
        onTourComplete={handleVoiceTourComplete}
        onProjectsStepReached={handleProjectsStepInController}
        currentGlobalStepId={currentTourStep}
      />
    </>
  );
};

export default IntegratedAssistantController;

    