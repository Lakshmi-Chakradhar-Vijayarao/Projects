
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { projectsData as pageProjectsData } from '@/components/sections/projects';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BrainCircuit, BotMessageSquare, Play, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

type TourStepId =
  | 'greeting'
  | 'about'
  | 'skills-section'
  | 'experience'
  | 'projects_intro' 
  | 'projects_list_intro' 
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
  | 'speaking_project_titles' 
  | 'ended';

type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused_by_user'
  | 'speaking_project_titles'
  | 'qa'
  | 'post_voice_tour_qa'
  | 'scrolled_to_end_greeting'
  | 'tour_declined_pending_scroll';

const IntegratedAssistantController: React.FC = () => {
  // --- State Variables ---
  // IMPORTANT: All useState and useRef hooks must be at the top, before useCallback/useEffect
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [showChatBubble, setShowBubble] = useState(true); 
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState<TourStepId>('greeting');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);
  const [isSpeakingProjectTitles, setIsSpeakingProjectTitles] = useState(false);
  const [currentProjectTitleIndex, setCurrentProjectTitleIndex] = useState(0);
  const [isSynthReady, setIsSynthReady] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);

  // --- Refs ---
  const isMountedRef = useRef(false);
  const initialGreetingDoneRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messageIdCounterRef = useRef(0);
  const projectTitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false, 
  });

  // --- Callbacks & Effects ---
  const speakTextNow = useCallback((text: string, onEnd?: () => void, isChainedCall = false) => {
    console.log(`IntegratedAssistantController: speakTextNow called with text: "${text.substring(0,30)}...", isChainedCall: ${isChainedCall}`);
    if (!isMountedRef.current || !synthRef.current || !text || !isSynthReady) {
      console.warn("IntegratedAssistantController: Speak conditions not met.", { isMounted: isMountedRef.current, synth: !!synthRef.current, text: !!text, isSynthReady });
      if (onEnd) onEnd();
      return;
    }

    if (controllerUtteranceRef.current) {
        console.log("IntegratedAssistantController: Clearing handlers from previous controller utterance.");
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
    }
    
    if (!isChainedCall && synthRef.current && synthRef.current.speaking) { // Only cancel if actively speaking
       console.log("IntegratedAssistantController: Global synth.cancel() called because synth is speaking and this is not a chained call.");
       synthRef.current.cancel(); 
    }
    controllerUtteranceRef.current = null;

    const utterance = new SpeechSynthesisUtterance(text);
    let spokenThisCall = false; // Flag to ensure speak is only called once per invocation

    utterance.onend = () => {
      if (!spokenThisCall) return; // Ensure it only acts if speak was called
      console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0,50)}..."`);
      if (controllerUtteranceRef.current === utterance) {
        controllerUtteranceRef.current.onend = null; 
        controllerUtteranceRef.current.onerror = null;
        controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd();
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
    
    controllerUtteranceRef.current = utterance;

    const trySpeak = () => {
        if (spokenThisCall || !synthRef.current || !isMountedRef.current) return;
        console.log(`IntegratedAssistantController: Attempting to speak via trySpeak: "${text.substring(0,30)}..."`);
        synthRef.current.speak(utterance);
        spokenThisCall = true; 
    };
    
    if (synthRef.current.getVoices().length > 0 || !speechSynthesis.onvoiceschanged) {
        trySpeak();
    } else {
        console.log("IntegratedAssistantController: Voices not immediately available, setting onvoiceschanged handler for speakTextNow.");
        const voiceChangeHandler = () => {
            if(synthRef.current) synthRef.current.onvoiceschanged = null;
            console.log("IntegratedAssistantController: Voices loaded (onvoiceschanged in speakTextNow), trying to speak.");
            trySpeak();
        };
        synthRef.current.onvoiceschanged = voiceChangeHandler;
        
        setTimeout(() => {
            if (controllerUtteranceRef.current === utterance && !spokenThisCall && synthRef.current?.onvoiceschanged === voiceChangeHandler) {
                if(synthRef.current) synthRef.current.onvoiceschanged = null;
                console.log("IntegratedAssistantController: Voices loaded (timeout fallback in speakTextNow), trying to speak.");
                trySpeak();
            }
        }, 300); // Increased timeout slightly for voice loading
    }
  }, [isSynthReady]);

  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    console.log("IntegratedAssistantController: addMessageToChat", { sender, text: typeof text === 'string' ? text.substring(0,30) : 'JSX Node' });
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
  }, [setChatMessages]);
  
  const initiateGreeting = useCallback(() => {
    if (!isMountedRef.current || initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: InitiateGreeting skipped (not mounted, or greeting already done).");
      return;
    }
    console.log("IntegratedAssistantController: Initiating greeting.");
    
    setChatMessages([]); 
    setChatInterfaceRenderKey(prev => prev + 1);
    
    const greetingTextNode = <p>Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?</p>;
    const greetingTextSpeakable = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    
    addMessageToChat('ai', greetingTextNode, greetingTextSpeakable);
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <Play className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    
    setIsChatInterfaceOpen(true);
    setShowBubble(false);
    setAssistantMode('greeting');
    setCurrentTourStep('greeting');
    setUserRespondedToGreeting(false);
    
    // Defer speech slightly to ensure UI is rendered
    requestAnimationFrame(() => {
        if (isMountedRef.current && synthRef.current && isSynthReady) {
          console.log("IntegratedAssistantController: Speaking initial greeting (deferred).");
          speakTextNow(greetingTextSpeakable);
        } else {
          console.warn("IntegratedAssistantController: Conditions not met for speaking initial greeting (isSynthReady or synthRef.current missing).", {isSynthReady, synthRefCurrent: !!synthRef.current});
        }
    });
    initialGreetingDoneRef.current = true;
  }, [addMessageToChat, speakTextNow, isSynthReady, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey, setCurrentTourStep]);

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log("IntegratedAssistantController: Quick reply action:", action);
    setChatQuickReplies([]);
    setIsSpeakingProjectTitles(false); 
    if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);

    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      setUserRespondedToGreeting(true);
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', <p>{startMessage}</p>, startMessage);
      speakTextNow(startMessage, () => {
        if (isMountedRef.current) {
            setTimeout(() => { 
                if (isMountedRef.current) {
                    console.log("IntegratedAssistantController: User chose 'Yes, Guide Me'. Starting voice tour.");
                    setIsChatInterfaceOpen(false);
                    setShowBubble(false); 
                    setStopVoiceTourSignal(false); 
                    setCurrentTourStep('about'); 
                    setStartVoiceTourSignal(true); 
                    setAssistantMode('voice_tour_active');
                }
            }, 300); // Increased delay for speech transition
        }
      });
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      setUserRespondedToGreeting(true);
      const declineMessage = "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!";
      addMessageToChat('ai', <p>{declineMessage}</p>, declineMessage);
      speakTextNow(declineMessage, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false);
          setShowBubble(true);
        }
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
        if (isMountedRef.current) {
            setTimeout(() => {
                if(isMountedRef.current) {
                    setIsChatInterfaceOpen(false);
                    setShowBubble(false); 
                    setCurrentTourStep('education-section');
                    setStartVoiceTourSignal(true); 
                    setStopVoiceTourSignal(false);
                    setAssistantMode('voice_tour_active');
                }
            }, 300); // Increased delay for speech transition
        }
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
      setShowBubble(true);
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
            if (isMountedRef.current) {
                setTimeout(() => {
                    if(isMountedRef.current){
                        setIsChatInterfaceOpen(false);
                        setShowBubble(false);
                        setStartVoiceTourSignal(true); 
                        setStopVoiceTourSignal(false);
                        setAssistantMode('voice_tour_active');
                    }
                }, 200);
            }
        });
    }
  }, [
    addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, 
    setStartVoiceTourSignal, setStopVoiceTourSignal, setCurrentTourStep, setChatQuickReplies, 
    setUserRespondedToGreeting, setChatMessages, setChatInterfaceRenderKey,
  ]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
    if (!isMountedRef.current) return;
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
    setShowBubble(false);
  }, [
      addMessageToChat, speakTextNow, setStartVoiceTourSignal, setStopVoiceTourSignal, 
      setVoiceTourCompleted, setAssistantMode, setCurrentTourStep, setChatMessages, setChatQuickReplies, 
      setIsChatInterfaceOpen, setShowBubble, setChatInterfaceRenderKey
  ]);
  
  const handleProjectsStepInController = useCallback(() => {
    console.log("IntegratedAssistantController: Reached projects step in ContentReader. Controller taking over for titles.");
    if (!isMountedRef.current) return;
    setStopVoiceTourSignal(true);
    
    setTimeout(() => {
        if (!isMountedRef.current) return;
        setAssistantMode('speaking_project_titles');
        setIsChatInterfaceOpen(true); 
        setShowBubble(false);
        setChatMessages([]); 
        setChatInterfaceRenderKey(prev => prev + 1); 
        setCurrentTourStep('speaking_project_titles');
        
        const genericProjectIntro = "Chakradhar has led and contributed to impactful projects. I will now list their titles.";
        addMessageToChat('ai', <p>{genericProjectIntro}</p>, genericProjectIntro);
        speakTextNow(genericProjectIntro, () => { 
            setTimeout(() => { // Added delay here before starting project titles
              if (isMountedRef.current) {
                  setCurrentProjectTitleIndex(0); 
                  setIsSpeakingProjectTitles(true); 
              }
            }, 200); // Delay before speaking first project title
        }, false);
    }, 300); // Delay for ContentReader to stop fully
  }, [
      addMessageToChat, speakTextNow, setChatMessages, setIsChatInterfaceOpen, setShowBubble, 
      setAssistantMode, setCurrentTourStep, setCurrentProjectTitleIndex, setIsSpeakingProjectTitles, 
      setStopVoiceTourSignal, setChatInterfaceRenderKey
  ]);

  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "isChatOpen:", isChatInterfaceOpen);
    if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
    }
    if (synthRef.current?.speaking || synthRef.current?.pending) synthRef.current.cancel();
    controllerUtteranceRef.current = null;
    
    if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    if (isSpeakingProjectTitles) setIsSpeakingProjectTitles(false);

    if (isChatInterfaceOpen) {
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
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
      setShowBubble(false); 
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
    addMessageToChat, initiateGreeting, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages, setUserRespondedToGreeting,
    setChatInterfaceRenderKey, hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting, isSynthReady,
    isSpeakingProjectTitles, setIsSpeakingProjectTitles, currentTourStep, setCurrentTourStep
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const initSynth = () => {
        if (synthRef.current && synthRef.current.getVoices().length > 0) {
          setIsSynthReady(true);
          console.log("IntegratedAssistantController: Speech synthesis voices loaded.");
          if(synthRef.current) synthRef.current.onvoiceschanged = null;
        }
      };
      if (synthRef.current.getVoices().length > 0) {
        initSynth();
      } else {
        synthRef.current.onvoiceschanged = initSynth;
        console.log("IntegratedAssistantController: Speech synthesis initialized, waiting for voices.");
      }
    } else {
      console.warn("IntegratedAssistantController: Speech synthesis not supported by this browser.");
      setIsSynthReady(false);
    }
    const contactElement = document.getElementById('contact');
    if (contactElement) contactSectionRef(contactElement);

    return () => {
      isMountedRef.current = false;
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        synthRef.current.cancel();
      }
    };
  }, [contactSectionRef]);

  useEffect(() => { // Initial Greeting Effect
    if (!initialGreetingDoneRef.current && isMountedRef.current && isSynthReady) {
        console.log("IntegratedAssistantController: Conditions met for initial greeting. Calling initiateGreeting.");
        initiateGreeting();
    }
  }, [initiateGreeting, isSynthReady]); 

  useEffect(() => { // Scrolled to end after declining tour
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen && userRespondedToGreeting) {
      console.log("IntegratedAssistantController: User declined tour and scrolled to contact section.");
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
      setShowBubble(false);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true);
    }
  }, [
      contactSectionInView, assistantMode, hasShownScrolledToEndGreeting, isChatInterfaceOpen, userRespondedToGreeting,
      addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen,
      setShowBubble, setAssistantMode, setHasShownScrolledToEndGreeting, isSynthReady, setChatInterfaceRenderKey
  ]);

  useEffect(() => { // Speaking project titles sequentially
    let titleSpeakTimeoutLocal: NodeJS.Timeout | null = null;
    if (isSpeakingProjectTitles && isMountedRef.current && synthRef.current && isSynthReady) {
      if (currentProjectTitleIndex < pageProjectsData.length) {
        const project = pageProjectsData[currentProjectTitleIndex];
        const introText = `Project: ${project.title}.`;
        addMessageToChat('ai', <p className="italic text-muted-foreground/80">{introText}</p>, introText);
        speakTextNow(introText, () => {
          if (isMountedRef.current && isSpeakingProjectTitles) { 
            titleSpeakTimeoutLocal = setTimeout(() => {
              if(isMountedRef.current && isSpeakingProjectTitles) setCurrentProjectTitleIndex(prev => prev + 1);
            }, 300); 
            projectTitleTimeoutRef.current = titleSpeakTimeoutLocal;
          }
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
        setShowBubble(false);
        setAssistantMode('qa'); 
        setCurrentTourStep('projects_list_intro');
      }
    }
    return () => {
      if (titleSpeakTimeoutLocal) clearTimeout(titleSpeakTimeoutLocal);
    };
  }, [
      isSpeakingProjectTitles, currentProjectTitleIndex, isSynthReady, addMessageToChat, speakTextNow, 
      setIsSpeakingProjectTitles, setCurrentProjectTitleIndex, setIsChatInterfaceOpen, setShowBubble, 
      setAssistantMode, setCurrentTourStep, setChatQuickReplies
  ]);

  const effectiveShowBubble = showChatBubble &&
    !isChatInterfaceOpen &&
    !(assistantMode === 'voice_tour_active' && startVoiceTourSignal) &&
    !isSpeakingProjectTitles;

  return (
    <>
      {isMountedRef.current && ( 
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
            addMessageToChat={addMessageToChat} 
            speakText={speakTextNow} 
          />
        </>
      )}
    </>
  );
};

export default IntegratedAssistantController;

    