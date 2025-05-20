
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

  const initialGreetingDoneRef = useRef(false);
  const messageIdCounterRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMountedRef = useRef(false);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For ContentReader's auto-advance

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !text) {
      console.warn("IntegratedAssistantController: SpeakTextNow conditions not met or text empty.", { isMounted: isMountedRef.current, synth: !!synthRef.current, text });
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: Attempting to speak: "${text.substring(0, 50)}..."`);

    if (controllerUtteranceRef.current) {
      console.log("IntegratedAssistantController: Clearing handlers from previous controller utterance before new speak/cancel.");
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    
    if (synthRef.current.speaking || synthRef.current.pending) {
        console.log("IntegratedAssistantController: synth.speaking or .pending is true. Calling synth.cancel().");
        synthRef.current.cancel(); 
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance; 

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
        errorDetails = event.error; 
      }
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current = null;
          // Do not call onEnd here typically, as an error means it didn't end successfully.
          // However, if onEnd is used for cleanup/flow continuation, consider if it should run.
          // For now, let's call it to ensure flow doesn't completely break.
          if (onEnd) onEnd(); 
      } else {
        console.log("IntegratedAssistantController: onError called for a stale/mismatched controller utterance.");
      }
    };
    
    synthRef.current.speak(utterance);
  }, []); 

  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    messageIdCounterRef.current += 1;
    const newMessage: ChatbotMessageType = {
      id: `${Date.now()}-${messageIdCounterRef.current}`,
      sender,
      text,
      timestamp: new Date(),
      speakableTextOverride,
    };
    setChatMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

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
    speakTextNow(greetingText);
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false);
  }, [addMessageToChat, speakTextNow]);

  const handleProjectsStepInController = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader reached projects step. Opening chat for project selection.");
    // ContentReader should have paused itself. Signal stop to be absolutely sure any ContentReader speech is cancelled.
    setStopVoiceTourSignal(true);

    // Brief delay to allow ContentReader's stop signal (and its potential synth.cancel()) to process
    // before the controller tries to speak its own new message.
    setTimeout(() => {
        setChatMessages([]); // Clear previous messages for project selection
        setChatInterfaceRenderKey(prev => prev + 1);

        const projectPromptMsg = "Select a project to learn more, or choose 'Next Section'.";
        addMessageToChat('ai', <p>{projectPromptMsg}</p>, projectPromptMsg);
        speakTextNow(projectPromptMsg); // Controller speaks this new prompt

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
        setAssistantMode('qa'); 
        setCurrentTourStep('projects_list_interactive'); 
    }, 300); // 300ms delay

  }, [
    addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, 
    setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep,
    setStopVoiceTourSignal
  ]);

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]);
    setUserRespondedToGreeting(true);

    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', startMessage, startMessage);
      speakTextNow(startMessage, () => {
        setTimeout(() => {
          setIsChatInterfaceOpen(false);
          setShowChatBubble(false);
          setCurrentTourStep('about'); // ContentReader will start from 'about'
          setStartVoiceTourSignal(true);
          setStopVoiceTourSignal(false);
          setAssistantMode('voice_tour_active');
        }, 300); // Delay to allow "Great!" to finish before ContentReader starts
      });
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      const declineMessage = "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!";
      addMessageToChat('ai', declineMessage, declineMessage);
      speakTextNow(declineMessage);
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true);
      setAssistantMode('tour_declined_pending_scroll');
      initialGreetingDoneRef.current = true; 
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
        }, 300);
      });
    } else if (action === 'open_qa') {
      setChatMessages([]); 
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
      if (synthRef.current?.speaking) synthRef.current.cancel();
      initialGreetingDoneRef.current = true; 
    } else if (action === 'resume_voice_tour') {
        const resumeMsg = "Resuming the voice tour...";
        addMessageToChat('ai', resumeMsg, resumeMsg);
        speakTextNow(resumeMsg, () => {
            setTimeout(() => {
                setIsChatInterfaceOpen(false);
                setShowChatBubble(false); // Keep bubble hidden during active tour
                // currentTourStep should already be at the paused step.
                setStartVoiceTourSignal(true); 
                setStopVoiceTourSignal(false);
                setAssistantMode('voice_tour_active');
            }, 200);
        });
    }
  }, [
    addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, 
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setCurrentTourStep, 
    setChatQuickReplies, setUserRespondedToGreeting, setChatMessages
  ]);

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
  }, [
    addMessageToChat, speakTextNow, setStartVoiceTourSignal, setStopVoiceTourSignal, 
    setVoiceTourCompleted, setAssistantMode, setChatMessages, setChatQuickReplies, 
    setIsChatInterfaceOpen, setShowChatBubble
  ]);
  
  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current); // Clear any ContentReader auto-advance
    
    // If chat is open, clicking bubble or 'X' should close it and potentially stop voice tour.
    if (isChatInterfaceOpen) {
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true);
        setChatQuickReplies([]); // Clear quick replies when closing
        if (assistantMode === 'voice_tour_active' || startVoiceTourSignal) {
            setAssistantMode('voice_tour_paused_by_user');
            setStopVoiceTourSignal(true); // Signal ContentReader to stop
            setStartVoiceTourSignal(false); // Ensure it doesn't restart immediately
        } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
             setAssistantMode('tour_declined_pending_scroll'); // User closed greeting before responding
             initialGreetingDoneRef.current = true; // Mark greeting as 'interacted with'
        } else {
          setAssistantMode('idle'); 
        }
        if(synthRef.current?.speaking) synthRef.current.cancel(); // Stop controller's own speech
    } else { 
        // Chat is closed, clicking bubble should open it.
        setShowChatBubble(false);
        setChatInterfaceRenderKey(prev => prev + 1); // Force re-render of ChatInterface
        setChatMessages([]); // Clear previous messages

        if (assistantMode === 'voice_tour_paused_by_user') {
             const resumeMsg = "The voice tour is paused. Would you like to resume, ask a question, or download the resume?";
             addMessageToChat('ai', resumeMsg, resumeMsg);
             speakTextNow(resumeMsg);
             setChatQuickReplies([
                { text: "Resume Tour", action: 'resume_voice_tour', icon: <Play className="mr-2 h-4 w-4" /> },
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
                { text: "End Interaction", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
             ]);
             // Assistant mode remains 'voice_tour_paused_by_user'
        } else if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
            const postTourMsg = "Welcome back! The guided tour is complete. You can ask questions or download the resume.";
            addMessageToChat('ai', postTourMsg, postTourMsg);
            speakTextNow(postTourMsg);
            setChatQuickReplies([
              { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
              { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
              { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
            setAssistantMode('qa'); 
        } else if (assistantMode === 'scrolled_to_end_greeting' || (assistantMode === 'tour_declined_pending_scroll' && contactSectionInView) ) {
             const scrolledEndMsg = "Thanks for exploring! Have any questions about Chakradhar's work or experience?";
             addMessageToChat('ai', scrolledEndMsg, scrolledEndMsg);
             speakTextNow(scrolledEndMsg);
             setChatQuickReplies([
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
             // Mode remains 'scrolled_to_end_greeting'
        } else { 
            // Default to re-initiating greeting if idle or in an unexpected state
            initialGreetingDoneRef.current = false; // Allow re-greeting
            initiateGreeting();
        }
        setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen, assistantMode, voiceTourCompleted, userRespondedToGreeting, contactSectionInView, startVoiceTourSignal,
    addMessageToChat, initiateGreeting, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages
  ]);
  
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices();
        if (voices && voices.length > 0) {
           if(synthRef.current) synthRef.current.onvoiceschanged = null; 
        }
      };
      if (synthRef.current.getVoices().length === 0) {
        synthRef.current.onvoiceschanged = loadVoices;
      } else {
        loadVoices(); 
      }
      console.log("IntegratedAssistantController: Speech synthesis initialized.");
    } else {
      console.warn("IntegratedAssistantController: Speech synthesis not supported.");
    }

    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactSectionRef(contactElement);
    } else {
        console.warn("IntegratedAssistantController: Contact section element not found for InView.")
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

  useEffect(() => {
    if (isMountedRef.current && !initialGreetingDoneRef.current && assistantMode === 'idle' && !isChatInterfaceOpen) {
        console.log("IntegratedAssistantController: Conditions met for initial greeting. Calling initiateGreeting.");
        initiateGreeting();
    }
  }, [initiateGreeting, assistantMode, isChatInterfaceOpen]); 

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
        initialSectionIndex={ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.findIndex(s => s.id === currentTourStep) || 0}
        currentGlobalStepId={currentTourStep} 
      />
    </>
  );
};

export default IntegratedAssistantController;

