
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { projectsData as pageProjectsData } from '@/components/sections/projects';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BrainCircuit, BotMessageSquare, Play, ArrowRight, Volume2, VolumeX } from 'lucide-react';

type TourStepId =
  | 'greeting'
  | 'about' // Corresponds to "Summary" from script, targets #about section
  | 'skills-section'
  | 'experience'
  | 'projects_intro' // Generic intro to projects spoken by ContentReader
  | 'speaking_project_titles' // Controller is speaking individual titles
  | 'projects_list_intro' // Controller prompts for project detail selection
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
  | 'speaking_project_titles';

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
  const [isMounted, setIsMounted] = useState(false);
  const [isSynthReady, setIsSynthReady] = useState(false);

  const [isSpeakingProjectTitles, setIsSpeakingProjectTitles] = useState(false);
  const [currentProjectTitleIndex, setCurrentProjectTitleIndex] = useState(0);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const initialGreetingDoneRef = useRef(false);
  const messageIdCounterRef = useRef(0);
  
  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false, // Keep observing
  });

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        setIsSynthReady(true);
      } else {
        synthRef.current.onvoiceschanged = () => {
          if (synthRef.current && synthRef.current.getVoices().length > 0) {
            setIsSynthReady(true);
            if (synthRef.current) synthRef.current.onvoiceschanged = null;
          }
        };
      }
    } else {
      setIsSynthReady(false);
    }
    const contactElement = document.getElementById('contact');
    if (contactElement) contactSectionRef(contactElement);

    return () => {
      setIsMounted(false);
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        synthRef.current.cancel();
      }
    };
  }, [contactSectionRef]);

  const speakTextNow = useCallback((text: string, onEnd?: () => void, isChainedCall = false) => {
    if (!isMounted || !synthRef.current || !text || !isSynthReady) {
      if (onEnd) onEnd();
      return;
    }

    if (controllerUtteranceRef.current) {
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }

    if (!isChainedCall && synthRef.current && synthRef.current.speaking) {
       console.log("IntegratedAssistantController: Global synth.cancel() called for new unchained controller message because it was speaking.");
       synthRef.current.cancel();
    } else if (!isChainedCall && synthRef.current && synthRef.current.pending) {
       console.log("IntegratedAssistantController: Utterances were pending, cancelling for new unchained controller message.");
       synthRef.current.cancel(); // Cancel pending as well
    }
    controllerUtteranceRef.current = null;

    let spokenThisCall = false;
    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance;

    utterance.onend = () => {
      if (controllerUtteranceRef.current === utterance) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
        controllerUtteranceRef.current = null;
        if (onEnd) onEnd();
      }
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error; 
      }
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current.onend = null; 
          controllerUtteranceRef.current.onerror = null;
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };
    
    const trySpeak = () => {
        if (spokenThisCall || !synthRef.current) return;
        spokenThisCall = true;
        synthRef.current.speak(utterance);
    };

    if (synthRef.current.getVoices().length > 0) {
        trySpeak();
    } else {
        const voiceChangeHandler = () => {
            if (synthRef.current && synthRef.current.getVoices().length > 0) {
                 if (synthRef.current) synthRef.current.onvoiceschanged = null;
                 trySpeak();
            }
        };
        synthRef.current.onvoiceschanged = voiceChangeHandler;
        setTimeout(() => { // Fallback
            if(!spokenThisCall && synthRef.current && synthRef.current.getVoices().length > 0){
                if (synthRef.current) synthRef.current.onvoiceschanged = null;
                trySpeak();
            } else if (!spokenThisCall) {
                if (onEnd) onEnd();
            }
        }, 250);
    }
  }, [isMounted, isSynthReady]);

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
    if (!isMounted || initialGreetingDoneRef.current) return;
    
    setChatMessages([]);
    setChatInterfaceRenderKey(prev => prev + 1);
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', <p>{greetingText}</p>, greetingText);
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <Play className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
    setAssistantMode('greeting');
    setCurrentTourStep('greeting');
    setUserRespondedToGreeting(false);
    speakTextNow(greetingText);
    initialGreetingDoneRef.current = true;
  }, [isMounted, addMessageToChat, speakTextNow]);

  const handleQuickReplyAction = useCallback((action: string) => {
    setChatQuickReplies([]);
    setIsSpeakingProjectTitles(false);

    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      setUserRespondedToGreeting(true);
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', <p>{startMessage}</p>, startMessage);
      speakTextNow(startMessage, () => {
        setTimeout(() => { // Give "Great!" message time to finish
          setIsChatInterfaceOpen(false);
          setShowChatBubble(false); 
          setStopVoiceTourSignal(false); 
          setCurrentTourStep('about'); 
          setStartVoiceTourSignal(true);
          setAssistantMode('voice_tour_active');
        }, 300); 
      });
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      setUserRespondedToGreeting(true);
      const declineMessage = "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!";
      addMessageToChat('ai', <p>{declineMessage}</p>, declineMessage);
      speakTextNow(declineMessage, () => {
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true);
      });
      setAssistantMode('tour_declined_pending_scroll');
    } else if (action.startsWith('project_detail_')) {
      const projectTitleFromAction = action.replace('project_detail_', '').replace(/_/g, ' ');
      const project = pageProjectsData.find(p => p.title === projectTitleFromAction);
      addMessageToChat('user', `Tell me more about: ${projectTitleFromAction}`);
      if (project) {
        const projectSpeakableText = project.description;
        addMessageToChat('ai', <p>{projectSpeakableText}</p>, projectSpeakableText);
        speakTextNow(projectSpeakableText, () => {
          const promptMsg = "Which other project would you like to hear more about, or shall we move to Education?";
          addMessageToChat('ai', <p>{promptMsg}</p>, promptMsg);
          speakTextNow(promptMsg, undefined, true);
          const projectButtons: ChatbotQuickReplyType[] = pageProjectsData.map(p => ({
            text: p.title,
            action: `project_detail_${p.title.replace(/\s+/g, '_')}`,
            icon: <BrainCircuit className="mr-2 h-4 w-4" />
          }));
          projectButtons.push({ text: "Next Section (Education)", action: "next_section_education", icon: <ArrowRight className="mr-2 h-4 w-4" /> });
          setChatQuickReplies(projectButtons);
        }, true);
      } else {
        addMessageToChat('ai', "Sorry, I couldn't find details for that project.");
      }
    } else if (action === 'next_section_education') {
      addMessageToChat('user', "Next Section (from Projects)");
      const nextMessage = "Okay, moving to Education.";
      addMessageToChat('ai', <p>{nextMessage}</p>, nextMessage);
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
      setChatInterfaceRenderKey(prev => prev + 1);
      setAssistantMode('qa');
      const qaMessage = "Great! What would you like to know about Chakradhar?";
      addMessageToChat('ai', <p>{qaMessage}</p>, qaMessage);
      speakTextNow(qaMessage);
      setChatQuickReplies([]);
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank');
      const downloadMessage = "The resume is being downloaded. Anything else I can help with?";
      addMessageToChat('ai', <p>{downloadMessage}</p>, downloadMessage);
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
      setUserRespondedToGreeting(true);
      initialGreetingDoneRef.current = true;
    } else if (action === 'resume_voice_tour') {
        const resumeMsg = "Resuming the voice tour...";
        addMessageToChat('user', "Resume Tour");
        addMessageToChat('ai', <p>{resumeMsg}</p>, resumeMsg);
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
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setCurrentTourStep, setChatQuickReplies, setUserRespondedToGreeting, setChatMessages, setChatInterfaceRenderKey, setIsSpeakingProjectTitles, voiceTourCompleted, userRespondedToGreeting, hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting, isSynthReady, currentTourStep, contactSectionInView]);

  const handleVoiceTourComplete = useCallback(() => {
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    setCurrentTourStep('ended');
    setChatMessages([]);
    setChatInterfaceRenderKey(prev => prev + 1);
    const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to explore anything else?";
    addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
    speakTextNow(endMessage);
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
  }, [addMessageToChat, speakTextNow, setStartVoiceTourSignal, setStopVoiceTourSignal, setVoiceTourCompleted, setAssistantMode, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setChatInterfaceRenderKey, setCurrentTourStep]);
  
  useEffect(() => {
    let speakTimeout: NodeJS.Timeout;
    if (isSpeakingProjectTitles && isMounted && synthRef.current && isSynthReady) {
      if (currentProjectTitleIndex < pageProjectsData.length) {
        const project = pageProjectsData[currentProjectTitleIndex];
        const introText = `Project: ${project.title}.`;
        addMessageToChat('ai', <p className="italic text-muted-foreground/80">{introText}</p>, introText);
        speakTextNow(introText, () => {
          speakTimeout = setTimeout(() => {
            setCurrentProjectTitleIndex(prev => prev + 1);
          }, 300);
        }, true);
      } else {
        setIsSpeakingProjectTitles(false);
        const promptMsg = "Which project would you like to hear more about in detail, or shall we move to Education section?";
        addMessageToChat('ai', <p>{promptMsg}</p>, promptMsg);
        speakTextNow(promptMsg, undefined, false);
        const projectButtons: ChatbotQuickReplyType[] = pageProjectsData.map(p => ({
          text: p.title,
          action: `project_detail_${p.title.replace(/\s+/g, '_')}`,
          icon: <BrainCircuit className="mr-2 h-4 w-4" />
        }));
        projectButtons.push({ text: "Next Section (Education)", action: "next_section_education", icon: <ArrowRight className="mr-2 h-4 w-4" /> });
        setChatQuickReplies(projectButtons);
        setIsChatInterfaceOpen(true);
        setShowChatBubble(false);
        setAssistantMode('qa'); 
        setCurrentTourStep('projects_list_intro');
      }
    }
    return () => {
      if (speakTimeout) clearTimeout(speakTimeout);
    };
  }, [isSpeakingProjectTitles, currentProjectTitleIndex, isMounted, isSynthReady, addMessageToChat, speakTextNow, setIsSpeakingProjectTitles, setCurrentProjectTitleIndex, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setChatQuickReplies]);

  const handleProjectsStepInController = useCallback(() => {
    setStopVoiceTourSignal(true);
    
    setTimeout(() => { // Delay to ensure ContentReader's speech has cleared
        setAssistantMode('speaking_project_titles');
        setIsChatInterfaceOpen(true);
        setShowChatBubble(false);
        setChatMessages([]); 
        setChatInterfaceRenderKey(prev => prev + 1); 
        setCurrentTourStep('speaking_project_titles');
        
        const genericProjectIntro = "Chakradhar has led and contributed to impactful projects. I will now list their titles.";
        addMessageToChat('ai', <p>{genericProjectIntro}</p>, genericProjectIntro);
        speakTextNow(genericProjectIntro, () => {
            setCurrentProjectTitleIndex(0);
            setIsSpeakingProjectTitles(true); 
        }, false);
    }, 500); // Increased delay for safety

  }, [addMessageToChat, speakTextNow, setChatMessages, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setCurrentProjectTitleIndex, setIsSpeakingProjectTitles, setStopVoiceTourSignal, setChatInterfaceRenderKey]);

  useEffect(() => {
    if (isMounted && isSynthReady && !initialGreetingDoneRef.current) {
      initiateGreeting();
    }
  }, [initiateGreeting, isSynthReady, isMounted]);
  
  const mainBubbleClickHandler = useCallback(() => {
    if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
    }
    if (synthRef.current?.speaking || synthRef.current?.pending) synthRef.current.cancel();
    controllerUtteranceRef.current = null;
    
    if (isSpeakingProjectTitles) setIsSpeakingProjectTitles(false);


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
      } else if (assistantMode === 'speaking_project_titles') {
          setAssistantMode('qa'); 
          setCurrentTourStep('projects_list_intro'); 
      } else {
        setAssistantMode('idle');
      }
    } else { 
      setShowChatBubble(false);
      setChatMessages([]);
      setChatInterfaceRenderKey(prev => prev + 1);
      setStopVoiceTourSignal(true);
      setStartVoiceTourSignal(false);

      if (assistantMode === 'voice_tour_paused_by_user') {
        const resumeMsg = "The voice tour is paused. Would you like to resume, ask a question, or download the resume?";
        addMessageToChat('ai', <p>{resumeMsg}</p>, resumeMsg);
        speakTextNow(resumeMsg);
        setChatQuickReplies([
          { text: "Resume Tour", action: 'resume_voice_tour', icon: <Play className="mr-2 h-4 w-4" /> },
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
          { text: "End Interaction", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
        setIsChatInterfaceOpen(true);
      } else if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa' || currentTourStep === 'ended') {
        const postTourMsg = "Welcome back! The guided tour is complete. You can ask questions or download the resume.";
        addMessageToChat('ai', <p>{postTourMsg}</p>, postTourMsg);
        speakTextNow(postTourMsg);
        setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
          { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
        setAssistantMode('qa');
        setIsChatInterfaceOpen(true);
      } else if (assistantMode === 'scrolled_to_end_greeting' || (assistantMode === 'tour_declined_pending_scroll' && contactSectionInView && !hasShownScrolledToEndGreeting)) {
        const scrolledEndMsg = "Thanks for exploring! Have any questions about Chakradhar's work or experience?";
        addMessageToChat('ai', <p>{scrolledEndMsg}</p>, scrolledEndMsg);
        if (isSynthReady) speakTextNow(scrolledEndMsg);
        setChatQuickReplies([
          { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
          { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
        ]);
        setAssistantMode('scrolled_to_end_greeting');
        setHasShownScrolledToEndGreeting(true);
        setIsChatInterfaceOpen(true);
      } else {
        initiateGreeting();
      }
    }
  }, [
    assistantMode, isChatInterfaceOpen, voiceTourCompleted, userRespondedToGreeting, contactSectionInView, startVoiceTourSignal,
    addMessageToChat, initiateGreeting, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages, setUserRespondedToGreeting,
    setChatInterfaceRenderKey, hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting, isSynthReady,
    isSpeakingProjectTitles, setIsSpeakingProjectTitles, currentTourStep, setCurrentTourStep
  ]);
  
  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen && userRespondedToGreeting) {
      setChatMessages([]);
      setChatInterfaceRenderKey(prev => prev + 1);
      const scrolledMsg = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions about his work or experience?";
      addMessageToChat('ai', <p>{scrolledMsg}</p>, scrolledMsg);
      if (isSynthReady) speakTextNow(scrolledMsg);
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
