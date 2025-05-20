
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { projectsData as pageProjectsData } from '@/components/sections/projects'; // Import projectsData
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BrainCircuit, BotMessageSquare, Play, Volume2, VolumeX, ArrowRight } from 'lucide-react';

type TourStepId = 
  | 'greeting'
  | 'about' 
  | 'skills-section' 
  | 'experience' 
  | 'projects_intro' 
  | 'projects_list_intro' // Controller handles speaking titles, then shows buttons
  | 'projects_detail' 
  | 'education-section' 
  | 'certifications-section' 
  | 'publication-section' 
  | 'additional_info' 
  | 'tour_declined'
  | 'scrolled_to_end_greeting'
  | 'post_voice_tour_qa'
  | 'qa' 
  | 'voice_tour_active' 
  | 'voice_tour_paused_by_user' 
  | 'ended';

type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused_by_user' 
  | 'qa' 
  | 'post_voice_tour_qa' 
  | 'scrolled_to_end_greeting' 
  | 'tour_declined_pending_scroll'
  | 'speaking_project_titles'; // New mode

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
  const [currentTourStep, setCurrentTourStep] = useState<TourStepId>('greeting');
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);
  const [isSynthReady, setIsSynthReady] = useState(false);
  const [isSpeakingProjectTitles, setIsSpeakingProjectTitles] = useState(false);
  const [currentProjectTitleIndex, setCurrentProjectTitleIndex] = useState(0);

  const initialGreetingDoneRef = useRef(false);
  const messageIdCounterRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMountedRef = useRef(false);
  const projectTitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false, 
  });

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

  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !text || !isSynthReady) {
      console.warn("IntegratedAssistantController: SpeakTextNow conditions not met or text empty.", { isMounted: isMountedRef.current, synth: !!synthRef.current, textProvided: !!text, isSynthReady });
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: Attempting to speak: "${text.substring(0, 50)}..."`);

    if (controllerUtteranceRef.current) {
      console.log("IntegratedAssistantController: Clearing handlers from previous controller utterance.");
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    // Always cancel any ongoing speech before the controller speaks to ensure it has priority.
    if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        console.log("IntegratedAssistantController: synth.speaking or .pending is true. Global synth.cancel() called for controller's own speech.");
        synthRef.current.cancel(); 
    }
    controllerUtteranceRef.current = null;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (controllerUtteranceRef.current === utterance) { 
        console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0, 50)}..."`);
        controllerUtteranceRef.current = null; 
        if (onEnd) onEnd();
      }
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) errorDetails = event.error; 
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      if (controllerUtteranceRef.current === utterance) controllerUtteranceRef.current = null;
      if (onEnd) onEnd(); 
    };
    controllerUtteranceRef.current = utterance; 
    synthRef.current.speak(utterance);
  }, [isSynthReady]);

  const speakNextProjectTitle = useCallback(() => {
    if (currentProjectTitleIndex < pageProjectsData.length) {
      const project = pageProjectsData[currentProjectTitleIndex];
      const introText = `Project: ${project.title}.`;
      addMessageToChat('ai', <p>{introText}</p>, introText); // Add to chat visually
      speakTextNow(introText, () => {
        setCurrentProjectTitleIndex(prev => prev + 1);
        projectTitleTimeoutRef.current = setTimeout(speakNextProjectTitle, 200); // Short delay to next title
      });
    } else {
      // All project titles spoken
      setIsSpeakingProjectTitles(false);
      const promptMsg = "Which project would you like to hear more about in detail, or shall we move to the Education section?";
      addMessageToChat('ai', <p>{promptMsg}</p>, promptMsg);
      speakTextNow(promptMsg);

      const projectButtons: ChatbotQuickReplyType[] = pageProjectsData.map(p => ({
        text: p.title,
        action: `project_detail_${p.title.replace(/\s+/g, '_')}`, // Create a unique action string
        icon: <BrainCircuit className="mr-2 h-4 w-4" />
      }));
      projectButtons.push({ text: "Next Section (Education)", action: "next_section_education", icon: <ArrowRight className="mr-2 h-4 w-4" /> });
      setChatQuickReplies(projectButtons);
      setIsChatInterfaceOpen(true); // Keep chat open for selection
      setShowChatBubble(false);
      setAssistantMode('qa'); // Or a 'project_selection' mode
      setCurrentTourStep('projects_list_intro'); 
    }
  }, [currentProjectTitleIndex, addMessageToChat, speakTextNow, setCurrentProjectTitleIndex, setIsSpeakingProjectTitles, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setChatQuickReplies]);


  const handleProjectsStepInController = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader reached projects_intro. Controller will now speak project titles.");
    setStopVoiceTourSignal(true); // Signal ContentReader to fully stop & clear its queue
    
    // Ensure ContentReader has fully stopped before controller speaks
    setTimeout(() => {
        setAssistantMode('speaking_project_titles');
        setIsChatInterfaceOpen(true); // Keep chat open to display titles as they are spoken
        setShowChatBubble(false);
        setChatMessages([]); // Clear previous messages for the project title listing
        setCurrentTourStep('projects_list_intro'); // Update current step
        setStartVoiceTourSignal(false); // Ensure voice tour signal is off
        setCurrentProjectTitleIndex(0); // Reset for iterating project titles
        setIsSpeakingProjectTitles(true);
        
        // Speak the initial generic intro to projects once.
        const genericProjectIntro = "Chakradhar has led and contributed to impactful projects. I will now list their titles.";
        addMessageToChat('ai', <p>{genericProjectIntro}</p>, genericProjectIntro);
        speakTextNow(genericProjectIntro, () => {
            // After generic intro, start speaking individual titles
            projectTitleTimeoutRef.current = setTimeout(speakNextProjectTitle, 500); 
        });

    }, 500); // Delay to ensure ContentReader stops

  }, [addMessageToChat, speakTextNow, setStopVoiceTourSignal, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setStartVoiceTourSignal, speakNextProjectTitle, setIsSpeakingProjectTitles, setCurrentProjectTitleIndex]);


  const initiateGreeting = useCallback(() => {
    if (initialGreetingDoneRef.current) return;
    console.log("IntegratedAssistantController: Initiating greeting.");
    setChatMessages([]);
    setChatInterfaceRenderKey(prev => prev + 1);
    
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
    
    speakTextNow(greetingText); 
    
    initialGreetingDoneRef.current = true;
  }, [addMessageToChat, speakTextNow]);

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 

    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      setUserRespondedToGreeting(true);
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', startMessage, startMessage);
      speakTextNow(startMessage, () => {
        setTimeout(() => {
            setIsChatInterfaceOpen(false); // Close chat for automated tour
            setShowChatBubble(false);    // Hide bubble during automated tour
            setCurrentTourStep('about'); 
            setStartVoiceTourSignal(true);
            setStopVoiceTourSignal(false);
            setAssistantMode('voice_tour_active');
        }, 300); 
      });
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      setUserRespondedToGreeting(true);
      const declineMessage = "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!";
      addMessageToChat('ai', declineMessage, declineMessage);
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true); 
      setAssistantMode('tour_declined_pending_scroll');
    } else if (action.startsWith('project_detail_')) {
        const projectTitleFromAction = action.replace('project_detail_', '').replace(/_/g, ' ');
        const project = pageProjectsData.find(p => p.title === projectTitleFromAction);
        const userClickedMsg = `Tell me more about: ${projectTitleFromAction}`;
        addMessageToChat('user', userClickedMsg);
        
        if (project) {
            const projectSpeakableText = project.description; // Use full description from projectsData
            addMessageToChat('ai', <p>{projectSpeakableText}</p>, projectSpeakableText);
            speakTextNow(projectSpeakableText, () => {
                 // After speaking detail, re-show project selection prompt
                const promptMsg = "Which other project would you like to hear more about, or shall we move to Education?";
                addMessageToChat('ai', <p>{promptMsg}</p>, promptMsg);
                speakTextNow(promptMsg);
                const projectButtons: ChatbotQuickReplyType[] = pageProjectsData.map(p => ({
                    text: p.title,
                    action: `project_detail_${p.title.replace(/\s+/g, '_')}`,
                    icon: <BrainCircuit className="mr-2 h-4 w-4" />
                }));
                projectButtons.push({ text: "Next Section (Education)", action: "next_section_education", icon: <ArrowRight className="mr-2 h-4 w-4" /> });
                setChatQuickReplies(projectButtons);
            });
        } else {
            addMessageToChat('ai', "Sorry, I couldn't find details for that project.");
        }
    } else if (action === 'next_section_education') {
      addMessageToChat('user', "Next Section (from Projects)");
      const nextMessage = "Okay, moving to Education.";
      addMessageToChat('ai', nextMessage, nextMessage);
      speakTextNow(nextMessage, () => {
        setTimeout(() => {
            setIsChatInterfaceOpen(false); // Close chat for automated tour
            setShowChatBubble(false);    // Hide bubble
            setCurrentTourStep('education-section'); 
            setStartVoiceTourSignal(true); 
            setStopVoiceTourSignal(false);
            setAssistantMode('voice_tour_active');
        }, 300); 
      });
    } else if (action === 'open_qa') {
      setChatMessages([]); 
      setChatInterfaceRenderKey(prev => prev + 1);
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
    setChatQuickReplies, setUserRespondedToGreeting, setChatMessages,
    setChatInterfaceRenderKey 
  ]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    
    setChatMessages([]);
    setChatInterfaceRenderKey(prev => prev + 1);

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
    console.log("IntegratedAssistantController: Bubble/Close clicked. Mode:", assistantMode, "Chat open:", isChatInterfaceOpen, "Greeting Done:", initialGreetingDoneRef.current, "User Responded:", userRespondedToGreeting);
    
    if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    setIsSpeakingProjectTitles(false);

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
        setChatMessages([]); 
        setChatInterfaceRenderKey(prev => prev + 1); 
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
             if(isSynthReady && scrolledEndMsg) speakTextNow(scrolledEndMsg);
             setChatQuickReplies([
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
             setAssistantMode('scrolled_to_end_greeting'); 
             setHasShownScrolledToEndGreeting(true);
        } else { 
            initiateGreeting();
        }
        setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen, assistantMode, voiceTourCompleted, userRespondedToGreeting, contactSectionInView, startVoiceTourSignal,
    addMessageToChat, initiateGreeting, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages, setUserRespondedToGreeting,
    setChatInterfaceRenderKey, hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting, isSynthReady,
    isSpeakingProjectTitles, setIsSpeakingProjectTitles
  ]);
  
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const checkVoices = () => {
        if (synthRef.current && synthRef.current.getVoices().length > 0) {
          setIsSynthReady(true);
          if (synthRef.current.onvoiceschanged !== undefined) synthRef.current.onvoiceschanged = null;
        }
      };
      if (synthRef.current.getVoices().length > 0) checkVoices();
      else if (synthRef.current.onvoiceschanged !== undefined) synthRef.current.onvoiceschanged = checkVoices;
      else setTimeout(() => { if (synthRef.current && synthRef.current.getVoices().length > 0) setIsSynthReady(true); else setIsSynthReady(false); }, 500);
    } else setIsSynthReady(false);

    const contactElement = document.getElementById('contact');
    if (contactElement) contactSectionRef(contactElement);

    return () => {
      isMountedRef.current = false;
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) synthRef.current.cancel();
    };
  }, [contactSectionRef]); 

  useEffect(() => {
    if (isMountedRef.current && isSynthReady && !initialGreetingDoneRef.current && assistantMode === 'idle' && !isChatInterfaceOpen) {
        initiateGreeting();
    }
  }, [isMountedRef, isSynthReady, initialGreetingDoneRef, assistantMode, isChatInterfaceOpen, initiateGreeting]);

  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen && userRespondedToGreeting) {
      setChatMessages([]);
      setChatInterfaceRenderKey(prev => prev + 1);
      const scrolledMsg = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions about his work or experience?";
      addMessageToChat('ai', scrolledMsg, scrolledMsg);
      if(isSynthReady) speakTextNow(scrolledMsg);
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
      contactSectionInView, assistantMode, hasShownScrolledToEndGreeting, isChatInterfaceOpen, userRespondedToGreeting,
      addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen,
      setShowChatBubble, setAssistantMode, setHasShownScrolledToEndGreeting, isSynthReady, setChatInterfaceRenderKey
  ]);
  
  useEffect(() => {
    // Trigger speaking next project title if in that mode and index updated
    if (isSpeakingProjectTitles && currentProjectTitleIndex > 0 && currentProjectTitleIndex < pageProjectsData.length) {
        // The actual call to speakNextProjectTitle is handled by the onEnd of the previous one to ensure sequence
    } else if (isSpeakingProjectTitles && currentProjectTitleIndex >= pageProjectsData.length) {
        // This condition is handled within speakNextProjectTitle to transition out
    }
  }, [isSpeakingProjectTitles, currentProjectTitleIndex, speakNextProjectTitle]);


  const effectiveShowBubble = showChatBubble && 
                              !isChatInterfaceOpen && 
                              !(assistantMode === 'voice_tour_active' && startVoiceTourSignal) &&
                              !isSpeakingProjectTitles;

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
        startTourSignal={startVoiceTourSignal}
        stopTourSignal={stopVoiceTourSignal}
        onTourComplete={handleVoiceTourComplete}
        onProjectsStepReached={handleProjectsStepInController}
        currentGlobalStepId={currentTourStep} 
      />
    </>
  );
};

export default IntegratedAssistantController;
