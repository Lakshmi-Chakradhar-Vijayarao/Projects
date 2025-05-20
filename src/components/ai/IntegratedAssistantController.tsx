
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BrainCircuit, BotMessageSquare, Play, Volume2, VolumeX } from 'lucide-react';

type TourStepId = 
  | 'greeting'
  | 'about' 
  | 'skills' 
  | 'experience' 
  | 'projects_intro' 
  | 'projects_detail' 
  | 'education' 
  | 'certifications' 
  | 'publication' 
  | 'additional_info' 
  | 'tour_declined'
  | 'scrolled_to_end_greeting'
  | 'post_voice_tour_qa'
  | 'qa' 
  | 'voice_tour_active' // This is a mode, not a step, remove from here if so
  | 'voice_tour_paused_by_user' // This is a mode
  | 'ended';


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
  // State declarations MUST be at the top
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
  const [currentTourStep, setCurrentTourStep] = useState<TourStepId>('greeting');
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);

  // Ref declarations after state
  const initialGreetingDoneRef = useRef(false);
  const messageIdCounterRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMountedRef = useRef(false);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false, 
  });

  // useCallback and useEffect declarations after state and refs
  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !text) {
      console.warn("IntegratedAssistantController: SpeakTextNow conditions not met or text empty.", { isMounted: isMountedRef.current, synth: !!synthRef.current, text });
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: Attempting to speak: "${text.substring(0, 50)}..."`);

    if (controllerUtteranceRef.current) {
      console.log("IntegratedAssistantController: Clearing handlers from previous controller utterance.");
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    
    if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        console.log("IntegratedAssistantController: synth.speaking or .pending is true. Global synth.cancel() called.");
        synthRef.current.cancel(); 
    }
    controllerUtteranceRef.current = null;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (controllerUtteranceRef.current === utterance) { 
        console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0, 50)}..."`);
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
      const utteranceTextForLog = utterance ? `"${utterance.text.substring(0,50)}..."` : "N/A";
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Utterance text:", utteranceTextForLog, "Error details:", errorDetails, "Event object:", event);
      
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };
    
    controllerUtteranceRef.current = utterance; 
    synthRef.current.speak(utterance);
  }, [synthRef, controllerUtteranceRef]); 

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
    setChatInterfaceRenderKey(prev => prev + 1); // Force re-render for new messages
    return newMessage;
  }, [setChatMessages, setChatInterfaceRenderKey]);

  const initiateGreeting = useCallback(() => {
    console.log("IntegratedAssistantController: Initiating greeting UI only.");
    setChatInterfaceRenderKey(prev => prev + 1);
    setChatMessages([]); 
    
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', greetingText, greetingText); 
    
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false); 
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); 
  }, [addMessageToChat, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setAssistantMode, setUserRespondedToGreeting, setShowChatBubble, setChatInterfaceRenderKey]);

  const handleProjectsStepInController = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader reached projects step. Opening chat for project selection.");
    setStopVoiceTourSignal(true); 

    setTimeout(() => {
        setChatMessages([]); 
        setChatInterfaceRenderKey(prev => prev + 1);

        const projectPromptMsg = "Select a project to learn more, or choose 'Next Section'.";
        addMessageToChat('ai', <p>{projectPromptMsg}</p>, projectPromptMsg);
        speakTextNow(projectPromptMsg);

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
        setCurrentTourStep('projects_intro'); 
        setStartVoiceTourSignal(false); 
    }, 300);

  }, [
    addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, 
    setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep,
    setStopVoiceTourSignal, setStartVoiceTourSignal, setChatInterfaceRenderKey
  ]);

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 

    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      setUserRespondedToGreeting(true);
      initialGreetingDoneRef.current = true;
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', startMessage, startMessage);
      speakTextNow(startMessage, () => {
        setTimeout(() => {
          setIsChatInterfaceOpen(false);
          setShowChatBubble(false); 
          setCurrentTourStep('about'); 
          setStartVoiceTourSignal(true);
          setStopVoiceTourSignal(false);
          setAssistantMode('voice_tour_active');
        }, 300); // Increased delay slightly
      });
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      setUserRespondedToGreeting(true);
      initialGreetingDoneRef.current = true;
      const declineMessage = "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!";
      addMessageToChat('ai', declineMessage, declineMessage);
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true);
      setAssistantMode('tour_declined_pending_scroll');
    } else if (action.startsWith('project_detail_')) {
      const projectSectionId = action.replace('project_detail_', '');
      const project = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(s => s.id === projectSectionId);
      const userClickedMsg = `Tell me about: ${project?.title || projectSectionId.replace(/_/g, ' ')}`;
      addMessageToChat('user', userClickedMsg);
      
      const projectSpeakableText = project?.speakableText_detail || project?.speakableText || `Details for ${project?.title || projectSectionId.replace(/_/g, ' ')} would be shown here.`;
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
          setCurrentTourStep('education'); 
          setStartVoiceTourSignal(true); 
          setStopVoiceTourSignal(false);
          setAssistantMode('voice_tour_active');
        }, 300); // Increased delay
      });
    } else if (action === 'open_qa') {
      setChatInterfaceRenderKey(prev => prev + 1);
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
      setStartVoiceTourSignal(false);
      if(synthRef.current?.speaking) synthRef.current.cancel();
      setUserRespondedToGreeting(true); 
      initialGreetingDoneRef.current = true;
    } else if (action === 'resume_voice_tour') {
        const resumeMsg = "Resuming the voice tour...";
        addMessageToChat('ai', resumeMsg, resumeMsg);
        speakTextNow(resumeMsg, () => {
            setTimeout(() => {
                setIsChatInterfaceOpen(false);
                setShowChatBubble(false); 
                setStartVoiceTourSignal(true); 
                setStopVoiceTourSignal(false);
                setAssistantMode('voice_tour_active');
            }, 200);
        });
    }
  }, [
    addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, 
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setCurrentTourStep, 
    setChatQuickReplies, setUserRespondedToGreeting, setChatMessages, voiceTourCompleted,
    setChatInterfaceRenderKey // Added setChatInterfaceRenderKey
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
    setIsChatInterfaceOpen, setShowChatBubble, setChatInterfaceRenderKey
  ]);
  
  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen, "Initial Greeting Done:", initialGreetingDoneRef.current, "User Responded:", userRespondedToGreeting);
    
    if (isChatInterfaceOpen) { 
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true);
        setChatQuickReplies([]); 
        if (assistantMode === 'voice_tour_active' || startVoiceTourSignal) {
            setAssistantMode('voice_tour_paused_by_user');
            setStopVoiceTourSignal(true); 
            setStartVoiceTourSignal(false); 
        } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
             setAssistantMode('tour_declined_pending_scroll'); 
             setUserRespondedToGreeting(true); 
             initialGreetingDoneRef.current = true;
        } else {
          setAssistantMode('idle'); 
        }
        if(synthRef.current?.speaking) synthRef.current.cancel();
    } else { 
        setShowChatBubble(false);
        setChatInterfaceRenderKey(prev => prev + 1); 
        setChatMessages([]); 
        setStopVoiceTourSignal(true); 
        setStartVoiceTourSignal(false);

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
        } else if (assistantMode === 'scrolled_to_end_greeting' || (assistantMode === 'tour_declined_pending_scroll' && contactSectionInView && !hasShownScrolledToEndGreeting) ) {
             const scrolledEndMsg = "Thanks for exploring! Have any questions about Chakradhar's work or experience?";
             addMessageToChat('ai', scrolledEndMsg, scrolledEndMsg);
             speakTextNow(scrolledEndMsg);
             setChatQuickReplies([
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
             setAssistantMode('scrolled_to_end_greeting'); // Keep or transition
             setHasShownScrolledToEndGreeting(true);
        } else { 
            const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
            if (!initialGreetingDoneRef.current || !userRespondedToGreeting) { // Only speak if truly first time or no response yet
                 speakTextNow(greetingText);
            }
            initiateGreeting();
        }
        setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen, assistantMode, voiceTourCompleted, userRespondedToGreeting, contactSectionInView, startVoiceTourSignal,
    addMessageToChat, initiateGreeting, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages, setUserRespondedToGreeting,
    setChatInterfaceRenderKey, hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting // Added missing states
  ]);
  
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const voices = synthRef.current.getVoices();
      if (voices.length === 0 && synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = () => {
          if(synthRef.current) synthRef.current.onvoiceschanged = null; 
          console.log("IntegratedAssistantController: Voices loaded via onvoiceschanged.");
        };
      } else if (voices.length > 0) {
         console.log("IntegratedAssistantController: Voices available on initial check.");
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
        console.log("IntegratedAssistantController: Unmounting. Cancelling controller speech.");
        synthRef.current.cancel();
      }
    };
  }, [contactSectionRef]); // contactSectionRef is stable

  // Effect for initial greeting UI
  useEffect(() => {
    if (!initialGreetingDoneRef.current && assistantMode === 'idle' && !isChatInterfaceOpen) {
        console.log("IntegratedAssistantController: Conditions met for initial greeting UI. Calling initiateGreeting.");
        initiateGreeting();
    }
  }, [initiateGreeting, assistantMode, isChatInterfaceOpen]); 

  // Effect for "scrolled to end after declining tour"
  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined. Opening chat for scrolled-to-end greeting.");
      setChatInterfaceRenderKey(prev => prev + 1);
      setChatMessages([]);
      const scrolledMsg = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions about his work or experience?";
      addMessageToChat('ai', scrolledMsg, scrolledMsg);
      speakTextNow(scrolledMsg); // This speech is user-initiated by scrolling
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
      setShowChatBubble, setAssistantMode, setHasShownScrolledToEndGreeting, initiateGreeting // Added initiateGreeting (used by mainBubbleClickHandler)
  ]);

  // This derived state determines if the physical bubble icon should be visible
  const effectiveShowBubble = showChatBubble && 
                              !isChatInterfaceOpen && 
                              !(assistantMode === 'voice_tour_active' && startVoiceTourSignal);

  return (
    <>
      <ChatbotBubble
        onClick={mainBubbleClickHandler}
        isVisible={effectiveShowBubble} 
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
        currentGlobalStepId={currentTourStep} 
      />
    </>
  );
};

export default IntegratedAssistantController;
      
    