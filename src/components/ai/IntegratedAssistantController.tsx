
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

  const initialGreetingDoneRef = useRef(false);
  const messageIdCounterRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isMountedRef = useRef(false); 
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);


  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false, 
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
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
      if (synthRef.current && synthRef.current.speaking) {
        console.log("IntegratedAssistantController: Unmounting. Cancelling speech.");
        synthRef.current.cancel();
      }
    };
  }, [contactSectionRef]);

  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !text) {
      console.warn("IntegratedAssistantController: SpeakTextNow called prematurely or with no text.");
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: Attempting to speak: "${text.substring(0, 50)}..."`);

    if (synthRef.current.speaking) {
      console.log("IntegratedAssistantController: Cancelling existing speech before speaking new text via speakTextNow.");
      synthRef.current.cancel();
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
  }, []); // synthRef is stable

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
    // Only speak here if it's an AI message *not* part of the main voice tour (ContentReader handles its own speech)
    if (sender === 'ai' && speakableTextOverride && assistantMode !== 'voice_tour_active') { 
      console.log("IntegratedAssistantController: Speaking AI message from addMessageToChat (not voice tour).");
      speakTextNow(speakableTextOverride);
    }
    return newMessage;
  }, [speakTextNow, assistantMode]); // Removed setChatMessages as it's stable from useState


  const initiateGreeting = useCallback(() => {
    console.log("IntegratedAssistantController: Initiating greeting.");
    setChatInterfaceRenderKey(prev => prev + 1); 
    setChatMessages([]); 
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    // Call addMessageToChat without its own speakTextNow, as we call it directly after.
    setChatMessages([{ id: `${Date.now()}-greeting`, sender: 'ai', text: greetingText, timestamp: new Date(), speakableTextOverride: greetingText }]);
    speakTextNow(greetingText); // Speak the greeting

    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); 
  }, [speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setUserRespondedToGreeting]);
  

  useEffect(() => {
    if (isMountedRef.current && !initialGreetingDoneRef.current) {
        console.log("IntegratedAssistantController: Initial greeting useEffect triggered.");
        initiateGreeting();
        initialGreetingDoneRef.current = true; 
    }
  }, [initiateGreeting]); // Only depends on initiateGreeting to run once after mount.

  const handleProjectsStepInController = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader reached projects step. Opening chat for project selection.");
    setStartVoiceTourSignal(false); 
    setStopVoiceTourSignal(true); 
    
    setChatInterfaceRenderKey(prev => prev + 1);
    // Add project intro message; speakable text is provided to avoid speaking JSX
    const projectIntroMsg = "Chakradhar has led and contributed to impactful projects. Here are the titles:";
    addMessageToChat('ai', projectIntroMsg, projectIntroMsg);

     const projectQuickReplies: ChatbotQuickReplyType[] = [
        { text: "AI-Powered Smart Detection of Crops and Weeds", action: "project_detail_AI-Powered_Smart_Detection_of_Crops_and_Weeds" },
        { text: "Search Engine for Movie Summaries", action: "project_detail_Search_Engine_for_Movie_Summaries" },
        { text: "Facial Recognition Attendance System", action: "project_detail_Facial_Recognition_Attendance_System" },
        { text: "Mushroom Classification with Scikit-Learn", action: "project_detail_Mushroom_Classification_with_Scikit-Learn" },
        { text: "Custom Process Scheduler", action: "project_detail_Custom_Process_Scheduler" },
        { text: "Next Section", action: "next_section_education", icon: <Play className="mr-2 h-4 w-4" /> }
     ];
    setChatQuickReplies(projectQuickReplies);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('qa'); 
    setCurrentTourStep('projects_list_intro'); 
  }, [addMessageToChat, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep]);

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); // Clear current quick replies
    setUserRespondedToGreeting(true);


    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', startMessage, startMessage);
      speakTextNow(startMessage, () => {
        setTimeout(() => { // Give a slight delay for speech to finish before starting tour
            console.log("IntegratedAssistantController: Signalling ContentReader to start voice tour from 'about'.");
            setCurrentTourStep('about'); 
            setStartVoiceTourSignal(true); 
            setStopVoiceTourSignal(false); // Ensure stop signal is off
          }, 300); 
      });
      setIsChatInterfaceOpen(false); 
      setShowChatBubble(false);    
      setAssistantMode('voice_tour_active');
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      const declineMessage = "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!";
      addMessageToChat('ai', declineMessage, declineMessage);
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true); 
      setAssistantMode('tour_declined_pending_scroll');
    } else if (action === 'open_qa') {
      setAssistantMode('qa');
      const qaMessage = "Great! What would you like to know about Chakradhar?";
      addMessageToChat('ai', qaMessage, qaMessage);
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank');
      const downloadMessage = "The resume is being downloaded. Anything else I can help with?";
      addMessageToChat('ai', downloadMessage, downloadMessage);
       setChatQuickReplies([
        { text: "Ask another Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
    } else if (action === 'end_chat_interaction' || action === 'not_right_now_scrolled_end') {
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true);
      setAssistantMode('idle');
      setStopVoiceTourSignal(true); // Stop any voice tour if chat is ended
    } else if (action.startsWith('project_detail_')) {
      const projectTitleKey = action.replace('project_detail_', '');
      // Find the speakableText for this project from ContentReader's data
      // This logic might be better if ContentReader exports its data or if data is centralized
      const projectDetail = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(p => p.id === projectTitleKey)?.speakableText;
      
      const userClickedMsg = `Tell me about: ${projectTitleKey.replace(/_/g, ' ')}`;
      addMessageToChat('user', userClickedMsg);

      if (projectDetail) {
        addMessageToChat('ai', projectDetail, projectDetail);
      } else {
        addMessageToChat('ai', `Details for ${projectTitleKey.replace(/_/g, ' ')} would be shown here.`, `Details for ${projectTitleKey.replace(/_/g, ' ')} would be shown here.`);
      }
      // Keep project quick replies visible
      setChatQuickReplies([
        { text: "AI-Powered Smart Detection of Crops and Weeds", action: "project_detail_AI-Powered_Smart_Detection_of_Crops_and_Weeds" },
        { text: "Search Engine for Movie Summaries", action: "project_detail_Search_Engine_for_Movie_Summaries" },
        { text: "Facial Recognition Attendance System", action: "project_detail_Facial_Recognition_Attendance_System" },
        { text: "Mushroom Classification with Scikit-Learn", action: "project_detail_Mushroom_Classification_with_Scikit-Learn" },
        { text: "Custom Process Scheduler", action: "project_detail_Custom_Process_Scheduler" },
        { text: "Next Section", action: "next_section_education", icon: <Play className="mr-2 h-4 w-4" /> }
      ]);
    } else if (action === 'next_section_education') {
      addMessageToChat('user', "Next Section (from Projects)");
      const nextMessage = "Okay, moving to Education.";
      addMessageToChat('ai', nextMessage, nextMessage);
      speakTextNow(nextMessage, () => {
        setTimeout(() => {
            console.log("IntegratedAssistantController: Signalling ContentReader to resume tour from education.");
            setCurrentTourStep('education-section'); 
            setStartVoiceTourSignal(true); 
            setStopVoiceTourSignal(false);
        }, 300);
      });
      setIsChatInterfaceOpen(false);
      setShowChatBubble(false);
      setAssistantMode('voice_tour_active');
    }
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setCurrentTourStep, setChatQuickReplies, setUserRespondedToGreeting]);

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
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false); 
  }, [addMessageToChat, setStartVoiceTourSignal, setStopVoiceTourSignal, setVoiceTourCompleted, setAssistantMode, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble]);
  
  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    setStopVoiceTourSignal(true); // Signal ContentReader to stop if active

    if (isChatInterfaceOpen) { 
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true);
        setChatQuickReplies([]); 
        if (assistantMode === 'voice_tour_active') {
            setAssistantMode('voice_tour_paused_by_user');
            setStartVoiceTourSignal(false); 
        } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
             setAssistantMode('tour_declined_pending_scroll'); 
        } else { // For other modes like qa, post_voice_tour_qa, etc.
          setAssistantMode('idle'); // Or a specific "paused_qa" state
        }
    } else { 
        setShowChatBubble(false); 
        setChatInterfaceRenderKey(prev => prev + 1);
        setChatMessages([]); 
        
        if (assistantMode === 'voice_tour_paused_by_user' || assistantMode === 'post_voice_tour_qa' || voiceTourCompleted) {
            const resumeMsg = "Welcome back! You can ask questions about Chakradhar's resume or download it.";
            addMessageToChat('ai', resumeMsg, resumeMsg);
            setChatQuickReplies([
              { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
              { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
              { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
            setAssistantMode('qa'); // General Q&A
        } else if (assistantMode === 'scrolled_to_end_greeting') {
             const scrolledEndMsg = "Thanks for exploring! Have any questions about Chakradhar's work or experience?";
             addMessageToChat('ai', scrolledEndMsg, scrolledEndMsg);
             setChatQuickReplies([
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
        } else { 
            initialGreetingDoneRef.current = false; // Allow re-greeting
            initiateGreeting(); 
        }
        setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen, assistantMode, voiceTourCompleted, userRespondedToGreeting,
    addMessageToChat, initiateGreeting, setIsChatInterfaceOpen, setShowChatBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal
  ]);

  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined. Opening chat.");
      setChatInterfaceRenderKey(prev => prev + 1);
      setChatMessages([]);
      const scrolledMsg = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions about his work or experience?";
      addMessageToChat('ai', scrolledMsg, scrolledMsg);
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
        initialSectionIndex={
            currentTourStep === 'about' ? 0 :
            currentTourStep === 'skills-section' ? 1 :
            currentTourStep === 'experience' ? 2 :
            currentTourStep === 'projects_intro' ? 3 :
            currentTourStep === 'education-section' ? 4 :
            currentTourStep === 'certifications-section' ? 5 :
            currentTourStep === 'publication-section' ? 6 :
            currentTourStep === 'additional_info' ? 7 : 0
        }
        currentGlobalStepId={currentTourStep}
      />
    </>
  );
};

export default IntegratedAssistantController;

    